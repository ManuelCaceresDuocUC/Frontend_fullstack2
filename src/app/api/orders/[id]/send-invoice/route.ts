// src/app/api/orders/[id]/send-invoice/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildInvoicePDF } from "@/lib/invoice";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeInvoiceNumber(o: { id: string; createdAt: Date }) {
  return `B-${String(o.createdAt.getFullYear()).slice(-2)}${o.id.slice(0, 6).toUpperCase()}`;
}
function fallbackTracking(orderId: string, carrier: string | null) {
  const pref = carrier === "Bluexpress" ? "BX" : "DP";
  return `${pref}-${orderId.slice(0, 8).toUpperCase()}`;
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const o = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, shipment: true },
    });
    if (!o) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    if (!(o.status === "PAID" || o.status === "FULFILLED")) {
      return NextResponse.json({ error: "La orden aún no está pagada" }, { status: 400 });
    }

    // Envío desde Shipment
    const carrier = o.shipment?.carrier ?? (o.shippingRegion === "Valparaíso" ? "Despacho propio" : "Bluexpress");
    const tracking = o.shipment?.tracking ?? fallbackTracking(o.id, carrier);

    // PDF boleta
    const invoiceNumber = makeInvoiceNumber(o);
    const pdf = await buildInvoicePDF({
      orderId: o.id,
      number: invoiceNumber,
      buyerName: o.buyerName,
      email: o.email,
      items: o.items.map((i) => ({
        name: i.name,
        brand: i.brand,
        ml: i.ml,
        unitPrice: i.unitPrice,
        qty: i.qty,
      })),
      subtotal: o.subtotal,
      shippingFee: o.shippingFee,
      total: o.total,
      address: {
        street: o.shippingStreet,
        city: o.shippingCity,
        region: o.shippingRegion,
        zip: o.shippingZip ?? undefined,
      },
    });

    // SMTP Gmail (envs requeridas)
    const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
    const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
    const SMTP_SECURE = process.env.SMTP_SECURE === "true"; // para 587 debe ser false
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const SMTP_FROM = process.env.SMTP_FROM || (SMTP_USER ? `MAfums <${SMTP_USER}>` : "");

    if (!SMTP_USER || !SMTP_PASS) {
      return NextResponse.json({ error: "SMTP_USER/SMTP_PASS no configurados" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE, // true solo si usas 465
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER, // Gmail suele exigir el mismo USER
      to: o.email,
      subject: `Boleta N° ${invoiceNumber} - Orden ${o.id}`,
      html: `<p>Gracias por tu compra.</p>
             <p>Número de envío: <strong>${tracking}</strong> (${carrier})</p>
             <p>Adjuntamos tu boleta en PDF.</p>`,
      attachments: [
        { filename: `Boleta_${invoiceNumber}.pdf`, content: pdf, contentType: "application/pdf" },
      ],
    });

    // Garantiza Shipment
    await prisma.shipment.upsert({
      where: { orderId: o.id },
      update: { carrier, tracking },
      create: { orderId: o.id, carrier, tracking },
    });

    return NextResponse.json({ ok: true, invoiceNumber, tracking, carrier });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
