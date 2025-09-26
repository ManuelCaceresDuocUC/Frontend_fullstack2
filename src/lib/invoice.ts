// src/lib/invoice.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const peso = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export async function buildInvoicePDF(input: {
  orderId: string; number: string; buyerName: string; email: string | null;
  items: { name: string; brand: string; ml: number | null; unitPrice: number; qty: number }[];
  subtotal: number; shippingFee: number; total: number;
  address?: { street: string; city: string; region: string; zip?: string };
}): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const x = 50;
let y = 792;
  const draw = (text: string, opts?: { bold?: boolean; size?: number; move?: number }) => {
    const size = opts?.size ?? 12;
    const f = opts?.bold ? fontBold : font;
    page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) });
    if (opts?.move) y -= opts.move;
  };

  // Encabezado
  draw("MAfums", { bold: true, size: 20, move: 24 });
  draw(`Boleta N° ${input.number}`, { size: 16, move: 28 });

  // Datos
  draw(`Orden: ${input.orderId}`, { size: 10, move: 14 });
  draw(`Cliente: ${input.buyerName} <${input.email ?? "N/D"}>`, { size: 10, move: 14 });
  if (input.address) {
    const a = input.address;
    draw(
      `Dirección: ${a.street || ""}, ${a.city || ""}, ${a.region || ""}${a.zip ? " " + a.zip : ""}`,
      { size: 10, move: 18 }
    );
  }
  y -= 6;
  draw("Detalle de compra:", { bold: true, move: 18 });

  // Items
  input.items.forEach((it) => {
    const desc = `${it.brand} ${it.name}${it.ml ? ` ${it.ml}ml` : ""} ×${it.qty}`;
    draw(`${desc} — ${peso(it.unitPrice * it.qty)}`, { move: 16 });
  });

  y -= 8;
  draw(`Subtotal: ${peso(input.subtotal)}`, { move: 16 });
  draw(`Envío: ${peso(input.shippingFee)}`, { move: 16 });
  y -= 8;
  draw(`Total: ${peso(input.total)}`, { bold: true, size: 14, move: 20 });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
