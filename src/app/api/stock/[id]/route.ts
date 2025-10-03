// src/app/api/stock/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/stock/[id] (id = perfumeId) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const variants = await prisma.perfumeVariant.findMany({
    where: { perfumeId: id },
    select: { id: true, ml: true, price: true, stock: true, active: true },
    orderBy: { ml: "asc" },
  });
  return NextResponse.json({ perfumeId: id, variants });
}

/** Normaliza acciones de stock (SET o INCR) */
async function applyStock(perfumeId: string, body: unknown) {
  const b = (body ?? {}) as {
    // nuevos
    variantId?: string;
    ml?: number;
    stock?: number;
    delta?: number;
    // legacy PUT { qty }
    qty?: number;
  };

  // compatibilidad PUT legado: qty === stock absoluto
  if (typeof b.qty === "number" && b.stock === undefined) b.stock = b.qty;

  // dónde aplicar: por id o por (perfumeId, ml)
  let where: Prisma.PerfumeVariantWhereUniqueInput | null = null;
  if (b.variantId) where = { id: b.variantId };
  else if (typeof b.ml === "number") where = { perfumeId_ml: { perfumeId, ml: Math.trunc(b.ml) } };
  if (!where) return NextResponse.json({ error: "falta variantId o ml" }, { status: 400 });

  try {
    // SET absoluto
    if (typeof b.stock === "number" && Number.isFinite(b.stock)) {
      const v = await prisma.perfumeVariant.update({
        where,
        data: { stock: Math.max(0, Math.trunc(b.stock)) },
        select: { id: true, ml: true, stock: true },
      });
      return NextResponse.json({ ok: true, variant: v });
    }

    // INCR/DECR
    if (typeof b.delta === "number" && Number.isFinite(b.delta)) {
      const v = await prisma.perfumeVariant.update({
        where,
        data: { stock: { increment: Math.trunc(b.delta) } },
        select: { id: true, ml: true, stock: true },
      });
      // clamp a 0
      if (v.stock < 0) {
        const fixed = await prisma.perfumeVariant.update({
          where: { id: v.id },
          data: { stock: 0 },
          select: { id: true, ml: true, stock: true },
        });
        return NextResponse.json({ ok: true, variant: fixed });
      }
      return NextResponse.json({ ok: true, variant: v });
    }

    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "variante no encontrada" }, { status: 404 });
    }
    console.error("[/api/stock] error", e);
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }
}

/** PATCH recomendado */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return applyStock(id, body);
}

/** PUT legado (acepta { qty } o { stock }) */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return applyStock(id, body);
}
