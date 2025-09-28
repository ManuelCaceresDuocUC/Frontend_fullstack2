// src/app/api/dte/[orderId]/pdf/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildInvoicePDF } from "@/lib/invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { orderId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const id = params.orderId;

  const o = await prisma.order.findUnique({
    where: { id },
    include: { items: true, shipment: true },
  });
  if (!o) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const invoiceNumber = `B-${String(o.createdAt.getFullYear()).slice(-2)}${o.id.slice(0, 6).toUpperCase()}`;

  const pdf = await buildInvoicePDF({
    orderId: o.id,
    number: invoiceNumber,
    buyerName: o.buyerName,
    email: o.email,
    items: o.items.map(i => ({
      name: i.name, brand: i.brand, ml: i.ml, unitPrice: i.unitPrice, qty: i.qty,
    })),
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    total: o.total,
    address: {
      street: o.shippingStreet, city: o.shippingCity,
      region: o.shippingRegion, zip: o.shippingZip ?? undefined,
    },
    // puedes incluir bandera: inCertification: true
  });

  const bytes = pdf instanceof Uint8Array ? pdf : new Uint8Array(pdf);
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

  return new Response(ab, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Boleta_${invoiceNumber}.pdf"`,
      "Cache-Control": "no-store",
      "Content-Length": String(bytes.byteLength),
    },
  });
}
