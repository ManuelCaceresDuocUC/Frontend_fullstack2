// src/app/api/perfumes/[id]/variants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function getPerfumeId(req: Request) {
  const u = new URL(req.url);
  const parts = u.pathname.split("/"); // ["", "api", "perfumes", "[id]", "variants"]
  const i = parts.indexOf("perfumes");
  return i >= 0 ? parts[i + 1] : "";
}

// GET /api/perfumes/[id]/variants
export async function GET(req: Request) {
  const perfumeId = getPerfumeId(req);
  const variants = await prisma.perfumeVariant.findMany({
    where: { perfumeId },
    select: { id: true, ml: true, price: true, stock: true, active: true },
    orderBy: { ml: "asc" },
  });
  return NextResponse.json({ perfumeId, variants });
}

// PATCH /api/perfumes/[id]/variants
export async function PATCH(req: Request) {
  const perfumeId = getPerfumeId(req);
  const b = await req.json() as { variantId?: string; ml?: number; stock?: number; delta?: number; reprice?: boolean };

  if (!b.variantId && typeof b.ml !== "number")
    return NextResponse.json({ error: "faltan variantId o ml" }, { status: 400 });

  const where: Prisma.PerfumeVariantWhereUniqueInput = b.variantId
    ? { id: b.variantId }
    : { perfumeId_ml: { perfumeId, ml: Number(b.ml) } };

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
      where: { id: v.id }, data: { stock: 0 },
      select: { id: true, ml: true, price: true, stock: true, perfumeId: true },
    });
  }

  if (b.reprice || !v.price || v.price <= 0) {
    const base = await prisma.perfume.findUnique({
      where: { id: v.perfumeId }, select: { ml: true, price: true },
    });
    if (!base || !base.price || base.price <= 0)
      return NextResponse.json({ error: "Base sin precio" }, { status: 400 });

    const newPrice = Math.round((base.price * v.ml) / base.ml);
    v = await prisma.perfumeVariant.update({
      where: { id: v.id }, data: { price: newPrice, active: true },
      select: { id: true, ml: true, price: true, stock: true, perfumeId: true },
    });
  }

  return NextResponse.json({ ok: true, variant: v });
}

// POST /api/perfumes/[id]/variants
export async function POST(req: Request) {
  const perfumeId = getPerfumeId(req);
  const input = await req.json() as { ml: number; price?: number; stock?: number };

  const base = await prisma.perfume.findUnique({
    where: { id: perfumeId }, select: { ml: true, price: true },
  });
  if (!base) return NextResponse.json({ error: "Perfume no existe" }, { status: 404 });
  if (!base.price || base.price <= 0) return NextResponse.json({ error: "Precio base inválido" }, { status: 400 });

  const price = input.price ?? Math.round((base.price * input.ml) / base.ml);

  const v = await prisma.perfumeVariant.create({
    data: { perfumeId, ml: input.ml, price, stock: input.stock ?? 0, active: true },
  });
  return NextResponse.json(v, { status: 201 });
}
