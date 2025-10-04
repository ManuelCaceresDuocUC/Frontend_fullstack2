// src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Line = { variantId: string; qty: number };
type Body = {
  email?: string;
  buyerName?: string;
  phone?: string;
  address?: { street?: string; city?: string; region?: string; zip?: string; notes?: string };
  items?: Line[];
  paymentMethod?: "WEBPAY" | "SERVIPAG" | "MANUAL" | "MERCADOPAGO" | "VENTIPAY";
};

async function parseCookieCart(): Promise<Line[]> {
  try {
    const jar = await cookies(); // <- await
    const raw = jar.get("cart")?.value ?? "";
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x: unknown) => {
        if (typeof x !== "object" || !x) return null;
        const vId = (x as Record<string, unknown>).variantId;
        const qty = Number((x as Record<string, unknown>).qty);
        if (typeof vId === "string" && qty > 0) return { variantId: vId, qty };
        return null;
      })
      .filter((x): x is Line => !!x);
  } catch {
    return [];
  }
}

function mapPayment(m?: Body["paymentMethod"]): PaymentMethod {
  if (m === "WEBPAY") return PaymentMethod.WEBPAY;
  if (m === "SERVIPAG") return PaymentMethod.SERVIPAG;
  return PaymentMethod.MANUAL; // fallback
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;

  const fromBody = Array.isArray(body.items) ? body.items : [];
  const fromCookie = await parseCookieCart(); // <- await
  const raw: Line[] = (fromBody.length ? fromBody : fromCookie).filter(
    (l): l is Line => !!l && typeof l.variantId === "string" && Number(l.qty) > 0
  );

  if (raw.length === 0) {
    return NextResponse.json({ error: "carrito vacío" }, { status: 400 });
  }

  // Cargar variantes
  const ids = raw.map((l) => l.variantId);
  const variants = await prisma.perfumeVariant.findMany({
    where: { id: { in: ids } },
    select: {
      id: true, ml: true, price: true, stock: true, active: true, perfumeId: true,
      perfume: { select: { name: true, brand: true } },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  // Normalizar contra stock
  const checked = raw
    .map((l) => {
      const v = byId.get(l.variantId);
      if (!v || !v.active) return null;
      const qty = Math.min(l.qty, v.stock);
      if (qty <= 0) return null;
      return {
        variantId: v.id,
        perfumeId: v.perfumeId,
        name: v.perfume.name,
        brand: v.perfume.brand,
        ml: v.ml,
        unitPrice: v.price,
        qty,
      };
    })
    .filter(Boolean) as Array<{
      variantId: string; perfumeId: string; name: string; brand: string; ml: number; unitPrice: number; qty: number;
    }>;

  if (checked.length === 0) {
    return NextResponse.json({ error: "sin stock" }, { status: 400 });
  }

  const subtotal = checked.reduce((s, x) => s + x.unitPrice * x.qty, 0);
  const shippingFee = 0;
  const total = subtotal + shippingFee;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        email: body.email ?? "",
        buyerName: body.buyerName ?? "",
        phone: body.phone ?? "",
        shippingStreet: body.address?.street ?? "",
        shippingCity: body.address?.city ?? "",
        shippingRegion: body.address?.region ?? "",
        shippingZip: body.address?.zip ?? "",
        shippingNotes: body.address?.notes ?? "",
        subtotal,
        shippingFee,
        total,
      },
    });

    await tx.orderItem.createMany({
      data: checked.map((l) => ({
        orderId: created.id,
        perfumeId: l.perfumeId,
        variantId: l.variantId,
        name: l.name,
        brand: l.brand,
        ml: l.ml,
        unitPrice: l.unitPrice,
        qty: l.qty,
      })),
    });

    // Descontar stock
    await Promise.all(
      checked.map((l) =>
        tx.perfumeVariant.update({
          where: { id: l.variantId },
          data: { stock: { decrement: l.qty } },
        })
      )
    );

    await tx.payment.create({
      data: {
        orderId: created.id,
        method: mapPayment(body.paymentMethod),
        status: PaymentStatus.INITIATED,
        amount: total,
      },
    });

    return created;
  });

  return NextResponse.json({ ok: true, id: order.id, total }, { status: 200 });
}
