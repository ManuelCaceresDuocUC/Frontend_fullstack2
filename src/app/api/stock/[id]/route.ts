// src/app/api/stock/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: devuelve variantes del perfume (id = perfumeId)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id: perfumeId } = params;
  const variants = await prisma.perfumeVariant.findMany({
    where: { perfumeId },
    select: { id: true, ml: true, price: true, stock: true, active: true },
    orderBy: { ml: "asc" },
  });
  return NextResponse.json({ ok: true, variants });
}

/**
 * PATCH: admite dos formatos:
 * 1) { ml, stock }                -> actualiza una sola variante del perfume
 * 2) { ml3?, ml5?, ml10? }        -> actualiza varias a la vez si vienen presentes
 *
 * Si la variante no existe, la crea con price=0 y active=true.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id: perfumeId } = params;
  const body = (await req.json().catch(() => ({}))) as
    | { ml?: number; stock?: number }
    | { ml3?: number; ml5?: number; ml10?: number };

  // helper para setear una variante por ml
  const upsertByMl = (ml: number, stock: number) =>
    prisma.perfumeVariant.upsert({
      where: { perfumeId_ml: { perfumeId, ml } },
      update: { stock },
      create: { perfumeId, ml, price: 0, stock, active: true },
      select: { id: true, ml: true, stock: true, price: true, active: true },
    });

  // caso 1: { ml, stock }
  if (typeof (body as any).ml === "number" && typeof (body as any).stock === "number") {
    const { ml, stock } = body as any;
    if (ml <= 0 || stock < 0) return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    const variant = await upsertByMl(ml, stock);
    return NextResponse.json({ ok: true, variant });
  }

  // caso 2: { ml3?, ml5?, ml10? }
  const updates: Array<{ ml: number; stock: number }> = [];
  if (typeof (body as any).ml3 === "number")  updates.push({ ml: 3,  stock: (body as any).ml3 });
  if (typeof (body as any).ml5 === "number")  updates.push({ ml: 5,  stock: (body as any).ml5 });
  if (typeof (body as any).ml10 === "number") updates.push({ ml: 10, stock: (body as any).ml10 });

  if (updates.length > 0) {
    if (updates.some(u => u.ml <= 0 || u.stock < 0)) {
      return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    }
    const variants = await prisma.$transaction(updates.map(u => upsertByMl(u.ml, u.stock)));
    return NextResponse.json({ ok: true, variants });
  }

  return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
}
