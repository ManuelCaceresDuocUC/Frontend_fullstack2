// src/lib/invoice.ts
import PDFDocument from "pdfkit";
import path from "node:path";

function peso(n: number) {
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

export async function buildInvoicePDF(input: {
  orderId: string; number: string; buyerName: string; email: string | null;
  items: { name: string; brand: string; ml: number | null; unitPrice: number; qty: number }[];
  subtotal: number; shippingFee: number; total: number;
  address?: { street: string; city: string; region: string; zip?: string };
}) {
  const doc = new PDFDocument({ size: "A4", margin: 36 });

  // Registrar y USAR la TTF antes de cualquier text()
  const fontPath = path.join(process.cwd(), "public", "fonts", "Inter-VariableFont_opsz,wght.ttf");
  doc.registerFont("body", fontPath);
  doc.font("body");

  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c as Buffer));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // Contenido
  doc.fontSize(20).text("MAfums");
  doc.moveDown(0.5);
  doc.fontSize(16).text(`Boleta N° ${input.number}`, { align: "right" });
  doc.moveDown();

  doc.fontSize(10);
  doc.text(`Orden: ${input.orderId}`);
  doc.text(`Cliente: ${input.buyerName} <${input.email ?? "N/D"}>`);
  if (input.address) {
    const a = input.address;
    doc.text(`Dirección: ${a.street}, ${a.city}, ${a.region}${a.zip ? " " + a.zip : ""}`);
  }

  doc.moveDown();
  doc.fontSize(12).text("Detalle de compra:");
  doc.moveDown(0.5);

  input.items.forEach((it) => {
    const desc = `${it.brand} ${it.name}${it.ml ? ` ${it.ml}ml` : ""} ×${it.qty}`;
    doc.text(`${desc} — ${peso(it.unitPrice * it.qty)}`);
  });

  doc.moveDown();
  doc.text(`Subtotal: ${peso(input.subtotal)}`);
  doc.text(`Envío: ${peso(input.shippingFee)}`);
  doc.moveDown(0.5);
  doc.fontSize(14).text(`Total: ${peso(input.total)}`, { align: "right" });

  doc.end();
  return done;
}
