// src/app/api/orders/[id]/label/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toBuffer as qrToBuffer } from "qrcode";
import bwipjs from "bwip-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mm = (v: number) => (v * 72) / 25.4;
const W = mm(100);
const H = mm(150);

export async function GET(_req: Request, context: unknown) {
  const { params } = context as { params: { id: string } };
  const id = params.id;

  try {
    const o = await prisma.order.findUnique({
      where: { id },
      include: { shipment: true, items: true },
    });
    if (!o) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const carrier   = o.shipment?.carrier ?? (o.shippingRegion === "Valparaíso" ? "Despacho propio" : "Bluexpress");
    const tracking  = o.shipment?.tracking ?? `BX-${o.id.slice(0, 8).toUpperCase()}`;
    const remitente = process.env.LABEL_SENDER_NAME || "MAfums";
    const remitAddr = process.env.LABEL_SENDER_ADDR || "Valparaíso, Chile";

    // Assets
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

    const draw = (t: string, x: number, y: number, size = 12, bold = false) =>
      page.drawText(t, { x, y, size, font: bold ? helvB : helv, color: rgb(0, 0, 0) });

    // Marco
    page.drawRectangle({ x: mm(2), y: mm(2), width: W - mm(4), height: H - mm(4), borderColor: rgb(0, 0, 0), borderWidth: 1 });

    // ===== Layout V2 con cursor =====
    const PAD = mm(6);
    let y = H - PAD;

    // QR fijo arriba-derecha
    const qrImg = await pdf.embedPng(qrPng);
    const qrSize = mm(36);
    const qrX = W - PAD - qrSize;
    const qrY = H - PAD - qrSize;
    page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    page.drawText("Escanea seguimiento", { x: qrX - mm(2), y: qrY - mm(3), size: 8, font: helv });

    // Header izquierda con cursor
    const flow = (t: string, size = 12, bold = false) => { draw(t, PAD, y, size, bold); y -= size + 3; };

    flow(carrier, 14, false);
    flow(tracking, 26, true);
    flow(new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(o.createdAt), 9);

    // Separador
    page.drawLine({ start: { x: PAD, y }, end: { x: W - PAD, y }, thickness: 0.8, color: rgb(0, 0, 0) });
    y -= mm(4);

    // Código de barras debajo del header
    const bcImg = await pdf.embedPng(barcodePng);
    const bcH = mm(18);
    const bcW = W - PAD * 2;
    page.drawImage(bcImg, { x: PAD, y: y - bcH, width: bcW, height: bcH });
    y -= bcH + mm(4);

    // Caja destinatario completa bajo el barcode
    const boxTop = y;
    const boxH = mm(58);
    page.drawRectangle({
      x: PAD - mm(2),
      y: boxTop - boxH,
      width: W - (PAD - mm(2)) * 2,
      height: boxH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    let yb = boxTop - mm(6);
    const put = (t: string, size = 10, bold = false) => { draw(t, PAD, yb, size, bold); yb -= size + 4; };

    put("DESTINATARIO", 11, true);
    put(o.buyerName, 12);
    put(`${o.shippingStreet}`, 10);
    put(`${o.shippingCity}, ${o.shippingRegion}${o.shippingZip ? ` · CP ${o.shippingZip}` : ""}`, 10);
    put("OBSERVACIONES:", 10, true);
    put((o.shippingNotes || "—").slice(0, 60), 9);

    // Avanza cursor general por debajo de la caja
    y = (boxTop - boxH) - mm(6);

    // ===== Fin layout V2 =====

    // Totales y remitente en zona baja estable
    draw(`TOTAL: ${o.total.toLocaleString("es-CL")}`, mm(6), mm(60), 11, true);
    draw(`Orden: ${o.id}`, mm(6), mm(52), 9);

    page.drawLine({ start: { x: mm(4), y: mm(28) }, end: { x: W - mm(4), y: mm(28) }, thickness: 1, color: rgb(0, 0, 0) });
    draw("REMITENTE", mm(7), mm(22), 10, true);
    draw(`${remitente} · ${remitAddr}`, mm(7), mm(14), 9);

    // Respuesta
    const bytes = await pdf.save();
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
