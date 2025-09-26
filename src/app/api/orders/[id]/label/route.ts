import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toBuffer as qrToBuffer } from "qrcode";
import bwipjs from "bwip-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mm = (v: number) => (v * 72) / 25.4; // mm → pt
const W = mm(100);
const H = mm(150);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    const o = await prisma.order.findUnique({
      where: { id },
      include: { shipment: true, items: true },
    });
    if (!o) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const carrier = o.shipment?.carrier ?? (o.shippingRegion === "Valparaíso" ? "Despacho propio" : "Bluexpress");
    const tracking = o.shipment?.tracking ?? `BX-${o.id.slice(0, 8).toUpperCase()}`;
    const remitente = process.env.LABEL_SENDER_NAME || "MAfums";
    const remitAddr = process.env.LABEL_SENDER_ADDR || "Valparaíso, Chile";

    // QR y Code128 como PNG (Uint8Array)
    const qrPng = await qrToBuffer(tracking, { errorCorrectionLevel: "M", margin: 0, width: 600, type: "png" });
    const barcodePng = await bwipjs.toBuffer({
      bcid: "code128",
      text: tracking,
      scale: 3,
      height: 14,
      includetext: false,
      backgroundcolor: "FFFFFF",
      paddingwidth: 0,
      paddingheight: 0,
    });

    // PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([W, H]);
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);
    const draw = (text: string, x: number, y: number, size = 12, bold = false) =>
      page.drawText(text, { x, y, size, font: bold ? helvB : helv, color: rgb(0, 0, 0) });

    // Marco exterior
    page.drawRectangle({
      x: mm(2),
      y: mm(2),
      width: W - mm(4),
      height: H - mm(4),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Header
    draw(carrier, mm(6), H - mm(16), 14);
    draw(tracking, mm(6), H - mm(30), 26, true);
    draw(
      new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(o.createdAt),
      mm(6),
      H - mm(38),
      9
    );

    // Código de barras
    const bcImg = await pdf.embedPng(barcodePng);
    page.drawImage(bcImg, { x: mm(6), y: H - mm(56), width: W - mm(20), height: mm(20) });

    // QR
    const qrImg = await pdf.embedPng(qrPng);
    const qrSize = mm(40);
    const qrX = W - qrSize - mm(8);
    const qrY = H - qrSize - mm(8);
    page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    draw("Escanea para seguimiento", qrX, qrY - mm(4), 8);

    // Caja destinatario
    const yBox = H - mm(96);
    page.drawRectangle({
      x: mm(4),
      y: yBox,
      width: W - mm(8),
      height: mm(52),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    draw("DESTINATARIO", mm(7), yBox + mm(45), 11, true);
    draw(o.buyerName, mm(7), yBox + mm(36), 12);
    draw(`${o.shippingStreet}`, mm(7), yBox + mm(27), 10);
    draw(
      `${o.shippingCity}, ${o.shippingRegion}${o.shippingZip ? ` · CP ${o.shippingZip}` : ""}`,
      mm(7),
      yBox + mm(18),
      10
    );
    draw("OBSERVACIONES:", mm(7), yBox + mm(10), 10, true);
    draw((o.shippingNotes || "—").slice(0, 60), mm(7), yBox + mm(4), 9);

    // Totales y remitente
    draw(`TOTAL: ${o.total.toLocaleString("es-CL")}`, mm(6), mm(60), 11, true);
    draw(`Orden: ${o.id}`, mm(6), mm(52), 9);
    page.drawLine({
      start: { x: mm(4), y: mm(28) },
      end: { x: W - mm(4), y: mm(28) },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    draw("REMITENTE", mm(7), mm(22), 10, true);
    draw(`${remitente} · ${remitAddr}`, mm(7), mm(14), 9);

    // Guardar y responder con ArrayBuffer real
    const bytes = await pdf.save(); // Uint8Array
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="etiqueta_${tracking}.pdf"`,
        "Cache-Control": "no-store",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
