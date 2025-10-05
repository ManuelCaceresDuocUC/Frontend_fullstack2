// src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";

type ItemIn =
  | { id: string; qty: number }           // perfume botella
  | { variantId: string; qty: number };   // decant (variant)

type Body = {
  email: string;
  buyerName: string;
  phone?: string;
  address: { street: string; city: string; region: string; zip?: string; notes?: string };
  shipping?: { fee?: number };
  items: ItemIn[];
  paymentMethod: "WEBPAY";
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body.buyerName?.trim() || !body.email?.trim() || !isEmail(body.email))
      return NextResponse.json({ error: "Datos de comprador inválidos" }, { status: 400 });
    if (!body.address?.street?.trim() || !body.address?.city?.trim() || !body.address?.region?.trim())
      return NextResponse.json({ error: "Dirección de envío incompleta" }, { status: 400 });
    if (!Array.isArray(body.items) || body.items.length === 0)
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });

    const varItems = body.items.filter((i): i is { variantId: string; qty: number } => "variantId" in i && !!i.variantId);
    const baseItems = body.items.filter((i): i is { id: string; qty: number } => "id" in i && !!i.id);

    const [variants, perfumes] = await Promise.all([
      varItems.length
        ? db.perfumeVariant.findMany({
            where: { id: { in: varItems.map(i => i.variantId) }, active: true },
            select: { id: true, ml: true, price: true, perfume: { select: { id: true, name: true, brand: true } } },
          })
        : Promise.resolve([]),
      baseItems.length
        ? db.perfume.findMany({
            where: { id: { in: baseItems.map(i => i.id) } },
            select: { id: true, name: true, brand: true, ml: true, price: true },
          })
        : Promise.resolve([]),
    ]);

    const varMap = new Map(variants.map(v => [v.id, v]));
    const perfMap = new Map(perfumes.map(p => [p.id, p]));

    type Line = {
      perfumeId: string;
      variantId?: string;
      name: string;
      brand: string;
      ml: number;
      unitPrice: number;
      qty: number;
    };
    const lines: Line[] = [];
    let subtotal = 0;

    for (const it of varItems) {
      const v = varMap.get(it.variantId);
      if (!v || !v.price || v.price <= 0 || it.qty < 1)
        return NextResponse.json({ error: "Precio/variante inválido" }, { status: 400 });

      lines.push({
        perfumeId: v.perfume.id,
        variantId: v.id,
        name: v.perfume.name,
        brand: v.perfume.brand,
        ml: v.ml,
        unitPrice: v.price,
        qty: it.qty,
      });
      subtotal += v.price * it.qty;
    }

    for (const it of baseItems) {
      const p = perfMap.get(it.id);
      if (!p || !p.price || p.price <= 0 || it.qty < 1)
        return NextResponse.json({ error: "Precio/producto inválido" }, { status: 400 });

      lines.push({
        perfumeId: p.id,
        name: p.name,
        brand: p.brand,
        ml: p.ml,
        unitPrice: p.price,
        qty: it.qty,
      });
      subtotal += p.price * it.qty;
    }

    const shippingFee = Math.max(0, Number(body.shipping?.fee ?? 0));
    const total = subtotal + shippingFee;
    if (total <= 0) return NextResponse.json({ error: "Total $0 inválido" }, { status: 400 });

    const order = await db.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          email: body.email.trim(),
          buyerName: body.buyerName.trim(),
          phone: body.phone?.trim() ?? null,
          shippingStreet: body.address.street.trim(),
          shippingCity: body.address.city.trim(),
          shippingRegion: body.address.region.trim(),
          shippingZip: body.address.zip?.trim() ?? "",
          shippingNotes: body.address.notes?.trim() ?? "",
          subtotal,
          shippingFee,
          total,
          status: OrderStatus.PENDING,
          items: {
            create: lines.map((l) => ({
              perfume: { connect: { id: l.perfumeId } },
              ...(l.variantId ? { variant: { connect: { id: l.variantId } } } : {}),
              name: l.name,
              brand: l.brand,
              ml: l.ml,
              unitPrice: l.unitPrice,
              qty: l.qty,
            })),
          },
        },
        select: { id: true },
      });

      await tx.payment.create({
        data: { orderId: o.id, method: "WEBPAY", status: PaymentStatus.INITIATED, amount: total },
      }).catch(() => undefined);

      return o;
    });

    return NextResponse.json({ id: order.id });
  } catch (e) {
    console.error("checkout error:", e);
    return NextResponse.json({ error: "Error en checkout" }, { status: 500 });
  }
}
