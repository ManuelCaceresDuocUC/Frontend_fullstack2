// src/app/api/dte/boleta/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDTE, pickFolio, getToken, sendEnvioDTE } from "@/lib/dte";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { orderId: string; tipo?: 39 | 41 };

export async function POST(req: Request) {
  try {
    const { orderId, tipo = 39 } = (await req.json()) as Body;

    const o = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!o) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // Folio libre según Dte ya emitidos
    const usados = await prisma.dte.findMany({ where: { tipo }, select: { folio: true } });
    const folio = pickFolio(tipo, usados.map(r => r.folio));

    const emisor = {
      rut: process.env.BILLING_RUT || "",
      rz: process.env.BILLING_BUSINESS_NAME || "",
      giro: process.env.BILLING_GIRO || "",
      dir: process.env.BILLING_ADDRESS || "",
      cmna: "Valparaíso",
    };

    // Usa tus campos reales: qty y unitPrice
    const items = o.items.map(it => ({
      nombre: it.name ?? "Producto",
      qty: Number(it.qty ?? 1),
      // si unitPrice viene con IVA, normaliza a neto
      precioNeto: Math.round(Number(it.unitPrice ?? 0) / 1.19),
    }));

    const { xml, total } = buildDTE({
      tipo,
      folio,
      emisor,
      items,
      fecha: new Date(o.createdAt).toISOString().slice(0, 10),
    });

    // TODO: timbrar con CAF + TED + firma XML
    const token = await getToken();
    const { trackid } = await sendEnvioDTE(xml, token);

    await prisma.dte.create({
      data: {
        orderId,
        tipo,
        folio,
        ted: "",
        xml: Buffer.from(xml, "utf8"),
        estadoSii: "ENVIADO",
        trackId: String(trackid),
      },
    });

    return NextResponse.json({ ok: true, folio, trackid, total });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
