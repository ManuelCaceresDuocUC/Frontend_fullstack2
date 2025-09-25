// src/app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const o = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { select: { id: true, brand: true, name: true, ml: true, unitPrice: true, qty: true, perfumeId: true } },
      payment: true,
      shipment: true, // <- usamos esta relación para carrier/tracking
    },
  });
  if (!o) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  // Mapea provider/tracking desde shipment si existe
  const provider = o.shipment?.carrier ?? null;
  const tracking = o.shipment?.tracking ?? null;

  return NextResponse.json({
    id: o.id,
    total: o.total,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    status: o.status, // "PENDING" | "PAID" | ...
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
    // Campos de boleta opcionales mientras no tengas tabla/columnas:
    invoice: {
      sent: false,
      url: null,
      number: null,
    },
    paymentMethod: o.payment?.method ?? null,
    items: o.items.map(it => ({
      id: it.id,
      brand: it.brand,
      name: it.name,
      ml: it.ml,
      unitPrice: it.unitPrice,
      qty: it.qty,
    })),
  });
}
