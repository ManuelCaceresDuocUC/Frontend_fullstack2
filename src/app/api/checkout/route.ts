// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMPPreference, type MPItem } from "@/lib/payments/mercadopago";
import { createWebpayTx } from "@/lib/payments/webpay";
import { createVentiSession } from "@/lib/payments/venti";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CartItem = { id: string; qty: number };
type Address = { street?: string; city?: string; region?: string; zip?: string; notes?: string };
type PaymentMethod = "MERCADOPAGO" | "WEBPAY" | "VENTIPAY" | "MANUAL";

type CheckoutPayload = {
  email: string;
  buyerName: string;
  phone?: string;
  address?: Address;
  items: CartItem[];
  paymentMethod: PaymentMethod;
};

type PerfumeRow = { id: string; name: string; brand: string; ml: number; price: number };

const fmtErr = (msg: string, code = 400) => NextResponse.json({ error: msg }, { status: code });

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutPayload;
    const { email, buyerName, phone, address, items, paymentMethod } = body;

    if (!email || !buyerName) return fmtErr("email y buyerName requeridos");
    if (!Array.isArray(items) || items.length === 0) return fmtErr("items vacíos");
    if (!paymentMethod) return fmtErr("paymentMethod requerido");

    // Catálogo
    const ids = items.map((it) => it.id);
    const perfumes: PerfumeRow[] = await prisma.perfume.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, brand: true, ml: true, price: true },
    });

    const itemsData = items.map((it) => {
      const p = perfumes.find((pp) => pp.id === it.id);
      if (!p) throw new Error(`Perfume ${it.id} no existe`);
      return {
        perfumeId: p.id,
        name: p.name,
        brand: p.brand,
        ml: p.ml,
        unitPrice: p.price,
        qty: it.qty,
      };
    });

    const subtotal = itemsData.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    // Método de pago para DB (tu enum actual es: WEBPAY | SERVIPAG | MANUAL)
    const methodForDb: "WEBPAY" | "SERVIPAG" | "MANUAL" =
      paymentMethod === "WEBPAY" ? "WEBPAY" : "MANUAL";

    // Cantidad requerida por perfume
    const needById = items.reduce<Record<string, number>>((acc, it) => {
      acc[it.id] = (acc[it.id] ?? 0) + it.qty;
      return acc;
    }, {});

    // Transacción: descuenta stock y crea orden
    const created = await prisma.$transaction(async (tx) => {
      // Descuento de stock seguro
      const updates = await Promise.all(
        Object.entries(needById).map(([perfumeId, need]) =>
          tx.stock.updateMany({
            where: { perfumeId, qty: { gte: need } },
            data: { qty: { decrement: need } },
          })
        )
      );
      const failed = updates.find((u) => u.count === 0);
      if (failed) throw new Error("Sin stock suficiente para uno o más productos.");

      // Crear orden
      const order = await tx.order.create({
        data: {
          email,
          buyerName,
          phone: phone ?? "",
          shippingStreet: address?.street ?? "",
          shippingCity: address?.city ?? "",
          shippingRegion: address?.region ?? "",
          shippingZip: address?.zip ?? "",
          shippingNotes: address?.notes ?? "",
          subtotal,
          shippingFee,
          total,
          status: "PENDING",
          items: { create: itemsData },
          payment: {
            create: {
              method: methodForDb,
              status: "INITIATED",
              amount: total,
            },
          },
        },
        select: { id: true },
      });

      return order;
    });

    // Crear transacción con proveedor y URL de redirección
    let redirectUrl: string | undefined;
   switch (paymentMethod) {
case "MERCADOPAGO": {
  const mpItems: MPItem[] = itemsData.map(i => ({
    title: `${i.brand} ${i.name}`,
    quantity: i.qty,
    unit_price: i.unitPrice,
    currency_id: "CLP",
  }));
  const pref = await createMPPreference({
  orderId: created.id,
  items: mpItems,
  returnUrl: `${process.env.APP_BASE_URL}/pago/mercadopago/retorno`,
  webhookUrl: `${process.env.APP_BASE_URL}/api/webhooks/mercadopago`,
});
  redirectUrl = pref.init_point;
  break;
}
  case "WEBPAY": {
    const { token, url } = await createWebpayTx({
      orderId: created.id, total,
      returnUrl: `${process.env.APP_BASE_URL}/pago/webpay/retorno`,
    });
    redirectUrl = `${url}?token_ws=${token}`;
    break;
  }
  case "VENTIPAY": {
    const { url } = await createVentiSession({
      orderId: created.id, total,
      returnUrl: `${process.env.APP_BASE_URL}/pago/venti/retorno`,
      webhookUrl: `${process.env.APP_BASE_URL}/api/webhooks/venti`,
    });
    redirectUrl = url;
    break;
  }
  case "MANUAL":
    break;
}

    return NextResponse.json({ id: created.id, redirectUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
