// src/app/api/perfumes/[id]/variants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/perfumes/[id]/variants  -> id = perfumeId */
export async function GET(_req: Request, { params }: { params: Record<string, string> }) {
  const { id } = params;
  const variants = await prisma.perfumeVariant.findMany({
    where: { perfumeId: id },
    select: { id: true, ml: true, price: true, stock: true, active: true },
    orderBy: { ml: "asc" },
  });
  return NextResponse.json({ perfumeId: id, variants });
}

/**
 * PATCH /api/perfumes/[id]/variants  -> id = perfumeId
 * Body:
 *  - { variantId?: string; ml?: number; stock?: number }   // set absoluto
 *  - { variantId?: string; ml?: number; delta?: number }   // incremento/decremento
 *  - reprice?: boolean                                     // recalcula price si falta
 */
export async function PATCH(req: Request, { params }: { params: Record<string, string> }) {
  const perfumeId = params.id;
  const b = (await req.json()) as {
    variantId?: string;
    ml?: number;
    stock?: number;
    delta?: number;
    reprice?: boolean;
  };

  if (!b.variantId && typeof b.ml !== "number") {
    return NextResponse.json({ error: "faltan variantId o ml" }, { status: 400 });
  }

  const where: Prisma.PerfumeVariantWhereUniqueInput = b.variantId
    ? { id: b.variantId }
    : { perfumeId_ml: { perfumeId, ml: Number(b.ml) } };

  // 1) actualiza stock
  let v = await prisma.perfumeVariant.update({
    where,
    data:
      typeof b.stock === "number"
        ? { stock: Math.max(0, Math.trunc(b.stock)) }
        : typeof b.delta === "number"
          ? { stock: { increment: Math.trunc(b.delta) } }
          : {},
    select: { id: true, ml: true, price: true, stock: true, perfumeId: true },
  });

  if (v.stock < 0) {
    v = await prisma.perfumeVariant.update({
      where: { id: v.id },
      data: { stock: 0 },
      select: { id: true, ml: true, price: true, stock: true, perfumeId: true },
    });
  }

  // 2) reprecifica si corresponde
  if (b.reprice || !v.price || v.price <= 0) {
    const base = await prisma.perfume.findUnique({
      where: { id: v.perfumeId },
      select: { ml: true, price: true },
    });
    if (!base || !base.price || base.price <= 0) {
      return NextResponse.json({ error: "Base sin precio" }, { status: 400 });
    }
    const newPrice = Math.round((base.price * v.ml) / base.ml);
    v = await prisma.perfumeVariant.update({
      where: { id: v.id },
      data: { price: newPrice, active: true },
      select: { id: true, ml: true, price: true, stock: true, perfumeId: true },
    });
  }

  return NextResponse.json({ ok: true, variant: v });
}

/** POST /api/perfumes/[id]/variants  -> crea variante y calcula price si no viene */
export async function POST(req: Request, { params }: { params: Record<string, string> }) {
  const perfumeId = params.id;
  const input = (await req.json()) as { ml: number; price?: number; stock?: number };

  const base = await prisma.perfume.findUnique({
    where: { id: perfumeId },
    select: { ml: true, price: true },
  });
  if (!base) return NextResponse.json({ error: "Perfume no existe" }, { status: 404 });
  if (!base.price || base.price <= 0) return NextResponse.json({ error: "Precio base inválido" }, { status: 400 });

  const price = input.price ?? Math.round((base.price * input.ml) / base.ml);

  const v = await prisma.perfumeVariant.create({
    data: { perfumeId, ml: input.ml, price, stock: input.stock ?? 0, active: true },
  });
  return NextResponse.json(v, { status: 201 });
}
