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
    const PAD = mm(6);
    let y = H - PAD;

    // QR arriba-derecha
    const qrImg = await pdf.embedPng(qrPng);
    const qrSize = mm(30);
    const qrX = W - PAD - qrSize;
    const qrY = H - PAD - qrSize;
    page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });
    draw("Escanea seguimiento", qrX - mm(2), qrY - mm(3), 8);

    // Header izquierda
    draw(carrier, PAD, y, 13, true); y -= 16;
    draw(tracking, PAD, y, 24, true); y -= 28;
    draw(new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" }).format(o.createdAt), PAD, y, 9); y -= 12;

    // Separador
    page.drawLine({ start: { x: PAD, y }, end: { x: W - PAD, y }, thickness: 0.8, color: rgb(0, 0, 0) });
    y -= mm(4);

    // Código de barras
    const bcImg = await pdf.embedPng(barcodePng);
    const bcH = mm(18);
    const bcW = W - PAD * 2;
    page.drawImage(bcImg, { x: PAD, y: y - bcH, width: bcW, height: bcH });
    y -= bcH + mm(3);
    draw(tracking, PAD, y, 9); // texto pequeño bajo el barcode
    y -= mm(5);

    // Caja destinatario
    const boxTop = y;
    const boxH = mm(64);
    page.drawRectangle({
      x: PAD - mm(2),
      y: boxTop - boxH,
      width: W - (PAD - mm(2)) * 2,
      height: boxH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    let yb = boxTop - mm(6);
    draw("DESTINATARIO", PAD, yb, 11, true); yb -= 14;

    draw(buyerName, PAD, yb, 12); yb -= 14;

    const maxTxtW = W - PAD * 2;
    for (const ln of wrap(street, maxTxtW, 10)) { draw(ln, PAD, yb, 10); yb -= 12; }
    for (const ln of wrap(cityReg, maxTxtW, 10)) { draw(ln, PAD, yb, 10); yb -= 12; }

    draw("OBSERVACIONES:", PAD, yb, 10, true); yb -= 12;
    for (const ln of wrap(notes, maxTxtW, 9)) { draw(ln, PAD, yb, 9); yb -= 11; }

    // Cursor bajo la caja
    y = (boxTop - boxH) - mm(8);

    // Totales y orden
    const yTotals = y;
    draw(`TOTAL: ${o.total.toLocaleString("es-CL")}`, PAD, yTotals, 11, true);
    draw(`Orden: ${o.id}`, PAD, yTotals - 12, 9);

    // Franja FRÁGIL
    const yFrag = yTotals - mm(10);
    page.drawLine({ start: { x: mm(4), y: yFrag }, end: { x: W - mm(4), y: yFrag }, thickness: 1, color: rgb(0,0,0) });
    draw("FRÁGIL · PERFUMERÍA · NO VOLCAR", PAD, yFrag - 6, 10, true);

    // Remitente
    const yRemTitle = yFrag - mm(14);
    draw("REMITENTE", PAD, yRemTitle, 10, true);
    let yRem = yRemTitle - 12;
    for (const ln of wrap(`${remitente} · ${remitAddr}${remitTel ? ` · Tel. ${remitTel}` : ""}`, W - PAD*2, 9)) {
      draw(ln, PAD, yRem, 9);
      yRem -= 11;
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
