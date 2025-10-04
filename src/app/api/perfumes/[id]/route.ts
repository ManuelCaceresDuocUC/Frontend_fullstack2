// src/app/api/perfumes/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Extrae el id de /api/perfumes/:id sin usar el 2º argumento
function getIdFromUrl(req: Request): string | null {
  const m = new URL(req.url).pathname.match(/\/api\/perfumes\/([^\/?#]+)/i);
  return m?.[1] ?? null;
}

export async function GET(req: Request) {
  const id = getIdFromUrl(req);
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const p = await prisma.perfume.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });

  const imgs: string[] = Array.isArray(p.images) ? (p.images as unknown as string[]) : [];

  return NextResponse.json({
    id: p.id,
    name: p.name,
    brand: p.brand,
    ml: p.ml,
    price: p.price,
    images: imgs,
    description: p.description,
    createdAt: p.createdAt,
    variants: p.variants.map(v => ({
      id: v.id,
      ml: v.ml,
      price: v.price,
      stock: v.stock,
      active: v.active,
    })),
  });
}

export async function DELETE(req: Request) {
  const id = getIdFromUrl(req);
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const exists = await prisma.perfume.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "no existe" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.perfumeVariant.deleteMany({ where: { perfumeId: id } });
    await tx.perfume.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
