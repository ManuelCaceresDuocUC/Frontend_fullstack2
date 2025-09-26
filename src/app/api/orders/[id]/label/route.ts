// src/app/api/orders/[id]/label/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const o = await prisma.order.findUnique({
      where: { id },
      include: { shipment: true },
    });
    if (!o) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([288, 432]); // 4x6 in
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 400;
    const draw = (t: string, s = 12, bold = false, move = 16) => {
      page.drawText(t, { x: 16, y, size: s, font: bold ? helvB : helv, color: rgb(0, 0, 0) });
      y -= move;
    };

    draw("MAfums", 18, true, 22);
    draw(`Orden: ${o.id}`, 10, false, 14);
    draw(`Carrier: ${o.shipment?.carrier ?? "N/D"}`, 12, true, 16);
    draw(`Tracking: ${o.shipment?.tracking ?? "N/D"}`, 12, true, 22);

    draw("Destinatario", 12, true, 18);
    draw(o.buyerName, 12);
    draw(`${o.shippingStreet}`, 12);
    draw(`${o.shippingCity}, ${o.shippingRegion}`, 12);
    if (o.shippingZip) draw(`CP: ${o.shippingZip}`, 12);
    if (o.shippingNotes) {
      y -= 6;
      draw("Notas:", 12, true, 14);
      draw(o.shippingNotes.slice(0, 60), 10, false, 12);
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Etiqueta_${o.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
