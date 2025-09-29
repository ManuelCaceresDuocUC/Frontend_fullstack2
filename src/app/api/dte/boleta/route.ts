// src/app/api/dte/boleta/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDTE, pickFolio, getToken, sendEnvioDTE } from "@/lib/dte";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { orderId: string; tipo?: 39 | 41 };

const reqEnv = (k: string) => {
  const v = process.env[k];
  if (!v?.trim()) throw new Error(`Falta ${k}`);
  return v.trim();
};

export async function POST(req: Request) {
  try {
    let body: Body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

    const { orderId, tipo = 39 } = body;
    if (!(tipo === 39 || tipo === 41)) return NextResponse.json({ error: "tipo inválido" }, { status: 400 });

    const exists = await prisma.dte.findUnique({ where: { orderId } });
    if (exists) return NextResponse.json({ ok: true, folio: exists.folio, trackid: exists.trackId }, { status: 200 });

    const o = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!o) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    if (!(o.status === "PAID" || o.status === "FULFILLED")) return NextResponse.json({ error: "La orden no está pagada" }, { status: 400 });
    if (!o.items.length) return NextResponse.json({ error: "Orden sin ítems" }, { status: 400 });

    const emisor = {
      rut: reqEnv("BILLING_RUT"),
      rz: reqEnv("BILLING_BUSINESS_NAME"),
      giro: reqEnv("BILLING_GIRO"),
      dir: reqEnv("BILLING_ADDRESS"),
      cmna: "Valparaíso",
    };

    const toInt = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const items = o.items.map(it => ({
      nombre: it.name || "Producto",
      qty: Math.max(1, toInt(it.qty)),
      precioNeto: Math.max(0, Math.round(toInt(it.unitPrice) / 1.19)),
    }));

    let intento = 0;
    // retry por colisión de @@unique([tipo, folio])
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const { folio, trackid, total } = await prisma.$transaction(async (tx) => {
          const usados = await tx.dte.findMany({ where: { tipo }, select: { folio: true } });
          const folio = pickFolio(tipo, usados.map(r => r.folio));

          const { xml, total } = buildDTE({
            tipo,
            folio,
            emisor,
            items,
            fecha: new Date(o.createdAt).toISOString().slice(0, 10),
          });

          const token = await getToken();
          const { trackid } = await sendEnvioDTE(xml, token);

          await tx.dte.create({
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

          return { folio, trackid, total };
        });

        return NextResponse.json({ ok: true, folio, trackid, total });
      } catch (e: unknown) {
        const isP2002 =
          e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
        if (isP2002 && intento < 1) { intento++; continue; }
        throw e;
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Emit DTE error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
