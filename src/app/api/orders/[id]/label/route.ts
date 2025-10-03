// src/app/api/orders/[id]/label/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as QRCode from "qrcode";
import bwipjs from "bwip-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mm = (v: number) => (v * 72) / 25.4;
const W = mm(100); // 100 x 150 mm
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

    // -------- Datos base
    const carrier   = (o.shipment?.carrier || (o.shippingRegion === "Valparaíso" ? "Despacho propio" : "Bluexpress")).toUpperCase();
    const tracking  = o.shipment?.tracking || `BX-${o.id.slice(0, 8).toUpperCase()}`;
    const buyerName = o.buyerName || "Cliente";
    const street    = o.shippingStreet || "";
    const cityReg   = `${o.shippingCity || ""}${o.shippingRegion ? `, ${o.shippingRegion}` : ""}${o.shippingZip ? ` · CP ${o.shippingZip}` : ""}`;
    const notes     = (o.shippingNotes || "—").replace(/\s+/g, " ").trim();
    const remitente = process.env.LABEL_SENDER_NAME || "LOS CÁCERES SPA (MAfums) · RUT 78.255.686-K";
    const remitAddr = process.env.LABEL_SENDER_ADDR || "Valparaíso, Chile";
    const remitTel  = process.env.LABEL_SENDER_PHONE || "";

    // -------- Assets (QR + Code128)
    const qrPayload = `TRACKING=${tracking};ORDEN=${o.id}`;
    const qrPng = await QRCode.toBuffer(qrPayload, {
      errorCorrectionLevel: "M",
      margin: 4, // quiet zone
      width: 680,
      type: "png",
    });

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

    // -------- PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([W, H]);
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);

    const draw = (t: string, x: number, y: number, size = 10, bold = false) =>
      page.drawText(t, { x, y, size, font: bold ? helvB : helv, color: rgb(0, 0, 0) });

    const wrap = (t: string, maxWidth: number, size: number, font = helv): string[] => {
      const words = t.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test;
        else { if (line) lines.push(line); line = w; }
      }
      if (line) lines.push(line);
      return lines;
    };

    // Marco/corte
    page.drawRectangle({ x: mm(2), y: mm(2), width: W - mm(4), height: H - mm(4), borderColor: rgb(0, 0, 0), borderWidth: 1 });

    // Margen y cursor
    const PAD = mm(8); // Más margen
    let y = H - PAD;

    // QR arriba-derecha (más grande y separado)
    const qrImg = await pdf.embedPng(qrPng);
    const qrSize = mm(36); // Más grande
    const qrX = W - PAD - qrSize;
    const qrY = H - PAD - qrSize;
    page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    draw("Escanea seguimiento", qrX, qrY - mm(5), 9); // Debajo del QR

    // Header izquierda
    draw(carrier, PAD, y, 14, true); y -= 18;
    draw(tracking, PAD, y, 22, true); y -= 26;
    draw(new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(o.createdAt), PAD, y, 10); y -= 14;

    // Separador
    page.drawLine({ start: { x: PAD, y }, end: { x: W - PAD, y }, thickness: 1, color: rgb(0, 0, 0) });
    y -= mm(6);

    // Código de barras (más espacio)
    const bcImg = await pdf.embedPng(barcodePng);
    const bcH = mm(18);
    const bcW = W - PAD * 2;
    page.drawImage(bcImg, { x: PAD, y: y - bcH, width: bcW, height: bcH });
    y -= bcH + mm(4);
    draw(tracking, PAD, y, 10); // texto bajo el barcode
    y -= mm(8);

    // Caja destinatario (más alta)
    const boxTop = y;
    const boxH = mm(72); // Más alto
    page.drawRectangle({
      x: PAD - mm(2),
      y: boxTop - boxH,
      width: W - (PAD - mm(2)) * 2,
      height: boxH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    let yb = boxTop - mm(8);
    draw("DESTINATARIO", PAD, yb, 12, true); yb -= 16;

    // Nombre
    draw(buyerName, PAD, yb, 13); yb -= 16;

    // Dirección con wrap (fuente más pequeña si es largo)
    const maxTxtW = W - PAD * 2;
    for (const ln of wrap(street, maxTxtW, 11)) { draw(ln, PAD, yb, 11); yb -= 13; }
    for (const ln of wrap(cityReg, maxTxtW, 11)) { draw(ln, PAD, yb, 11); yb -= 13; }

    // Observaciones
    draw("OBSERVACIONES:", PAD, yb, 11, true); yb -= 13;
    for (const ln of wrap(notes, maxTxtW, 10)) { draw(ln, PAD, yb, 10); yb -= 12; }

    // Cursor bajo la caja
    y = (boxTop - boxH) - mm(10);

    // Totales y orden
    const yTotals = y;
    draw(`TOTAL: ${o.total.toLocaleString("es-CL")}`, PAD, yTotals, 12, true);
    draw(`Orden: ${o.id}`, PAD, yTotals - 14, 10);

    // Franja FRÁGIL
    const yFrag = yTotals - mm(12);
    page.drawLine({ start: { x: mm(4), y: yFrag }, end: { x: W - mm(4), y: yFrag }, thickness: 1.2, color: rgb(0,0,0) });
    draw("FRÁGIL · PERFUMERÍA · NO VOLCAR", PAD, yFrag - 8, 11, true);

    // Remitente
    const yRemTitle = yFrag - mm(16);
    draw("REMITENTE", PAD, yRemTitle, 11, true);
    let yRem = yRemTitle - 14;
    for (const ln of wrap(`${remitente} · ${remitAddr}${remitTel ? ` · Tel. ${remitTel}` : ""}`, W - PAD*2, 10)) {
      draw(ln, PAD, yRem, 10);
      yRem -= 12;
    }

    // Respuesta (sin problemas de tipos)
    const pdfBytes = await pdf.save(); // Uint8Array
    const ab = new ArrayBuffer(pdfBytes.length); // ArrayBuffer limpio
    new Uint8Array(ab).set(pdfBytes);

    return new NextResponse(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="etiqueta_${tracking}.pdf"`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        "Content-Length": String(pdfBytes.length),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
