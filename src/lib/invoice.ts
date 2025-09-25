// src/lib/invoice.ts
import PDFDocument from "pdfkit";

// TIP: instala los tipos
// npm i -D @types/pdfkit

function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function buildInvoicePDF(input: {
  orderId: string; number: string; buyerName: string; email: string;
  items: { name: string; brand: string; ml: number | null; unitPrice: number; qty: number }[];
  subtotal: number; shippingFee: number; total: number;
  address?: { street: string; city: string; region: string; zip?: string };
}) {
  const doc = new PDFDocument({ size: "A4", margin: 36 });

  // Encabezado
  doc.fontSize(20).text("MAfums", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(16).text(`Boleta N° ${input.number}`, { align: "right" });
  doc.moveDown();

  // Datos de orden
  doc.fontSize(10);
  doc.text(`Orden: ${input.orderId}`);
  doc.text(`Cliente: ${input.buyerName} <${input.email}>`);
  if (input.address) {
    const a = input.address;
    doc.text(`Dirección: ${a.street}, ${a.city}, ${a.region}${a.zip ? " " + a.zip : ""}`);
  }

  // Detalle
  doc.moveDown();
  doc.fontSize(12).text("Detalle de compra:");
  doc.moveDown(0.5);

  input.items.forEach((it) => {
    const desc = `${it.brand} ${it.name}${it.ml ? ` ${it.ml}ml` : ""} x${it.qty}`;
    doc.text(desc);
    doc.text(
      `   ${it.unitPrice.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      })}`
    );
  });

  // Totales
  doc.moveDown();
  doc.text(
    `Subtotal: ${input.subtotal.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })}`
  );
  doc.text(
    `Envío: ${input.shippingFee.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })}`
  );
  doc.moveDown(0.5);
  doc.fontSize(14).text(
    `Total: ${input.total.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })}`,
    { align: "right" }
  );

  doc.end();
  return pdfToBuffer(doc as unknown as PDFKit.PDFDocument);
}
