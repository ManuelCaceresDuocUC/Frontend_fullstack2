// src/app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };
function isCtx(x: unknown): x is Ctx {
  return (
    typeof x === "object" &&
    x !== null &&
    "params" in x &&
    typeof (x as { params?: unknown }).params === "object" &&
    (x as { params: { id?: unknown } }).params !== null &&
    typeof (x as { params: { id?: unknown } }).params.id === "string"
  );
}

export async function GET(_req: Request, ctx: unknown) {
  if (!isCtx(ctx)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  const { id } = ctx.params;

  const o = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        select: { id: true, brand: true, name: true, ml: true, unitPrice: true, qty: true, perfumeId: true },
      },
      payment: true,
      shipment: true,
    },
  });
  if (!o) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const provider = o.shipment?.carrier ?? null;
  const tracking = o.shipment?.tracking ?? null;

  return NextResponse.json({
    id: o.id,
    total: o.total,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    status: o.status,
    email: o.email,
    buyerName: o.buyerName,
    address: {
      street: o.shippingStreet,
      city: o.shippingCity,
      region: o.shippingRegion,
      zip: o.shippingZip,
      notes: o.shippingNotes,
    },
    shipping: {
      provider: provider as "Bluexpress" | "Despacho propio" | "Pendiente" | null,
      tracking,
    },
    invoice: { sent: false, url: null, number: null },
    paymentMethod: o.payment?.method ?? null,
    items: o.items.map((it) => ({
      id: it.id,
      brand: it.brand,
      name: it.name,
      ml: it.ml,
      unitPrice: it.unitPrice,
      qty: it.qty,
    })),
  });
}
