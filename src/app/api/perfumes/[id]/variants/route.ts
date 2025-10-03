// src/app/api/stock/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/stock/[id]  -> id = perfumeId */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const variants = await prisma.perfumeVariant.findMany({
    where: { perfumeId: id },
    select: { id: true, ml: true, price: true, stock: true, active: true },
    orderBy: { ml: "asc" },
  });
  return NextResponse.json({ perfumeId: id, variants });
}

/**
 * PATCH /api/stock/[id]  -> id = perfumeId
 * Body:
 *  - { variantId?: string; ml?: number; stock?: number }   // set absoluto
 *  - { variantId?: string; ml?: number; delta?: number }   // incremento/decremento
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id: perfumeId } = await params;
  const b = (await req.json()) as {
    variantId?: string;
    ml?: number;
    stock?: number;
    delta?: number;
  };

  if (!b.variantId && typeof b.ml !== "number") {
    return NextResponse.json({ error: "faltan variantId o ml" }, { status: 400 });
  }

  const where: Prisma.PerfumeVariantWhereUniqueInput = b.variantId
    ? { id: b.variantId }
    : { perfumeId_ml: { perfumeId, ml: Number(b.ml) } };

  if (typeof b.stock === "number") {
    const v = await prisma.perfumeVariant.update({
      where,
      data: { stock: Math.max(0, Math.trunc(b.stock)) },
      select: { id: true, ml: true, stock: true },
    });
    return NextResponse.json({ ok: true, variant: v });
  }

  if (typeof b.delta === "number" && Number.isFinite(b.delta)) {
    const v = await prisma.perfumeVariant.update({
      where,
      data: { stock: { increment: Math.trunc(b.delta) } },
      select: { id: true, ml: true, stock: true },
    });
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
}

/* OPCIÓN alternativa “a prueba de cambios”:
export async function GET(_req: Request, ctx: unknown) {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  ...
}
*/
