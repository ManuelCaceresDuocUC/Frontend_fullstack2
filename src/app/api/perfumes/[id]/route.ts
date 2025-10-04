// src/app/api/perfumes/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteMany as s3DeleteMany } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---- helpers ---- */
function getParams(ctx: unknown): { id: string } {
  if (typeof ctx === "object" && ctx && "params" in (ctx as any)) {
    const p = (ctx as any).params;
    if (p && typeof p.id === "string") return { id: p.id };
  }
  throw new Error("Route context inválido");
}
const toArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const s3Base = (process.env.S3_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const toKey = (url: string) => {
  if (!/^https?:\/\//i.test(url)) return url.replace(/^\/+/, "");
  return s3Base && url.startsWith(s3Base + "/") ? url.slice(s3Base.length + 1) : "";
};

/* ---- GET /api/perfumes/:id ---- */
export async function GET(_req: Request, ctx: unknown) {
  const { id } = getParams(ctx);
  const perfume = await prisma.perfume.findUnique({
    where: { id },
    include: {
      variants: {
        where: { ml: { in: [3, 5, 10] } },
        select: { id: true, ml: true, price: true, stock: true, active: true },
        orderBy: { ml: "asc" },
      },
    },
  });
  if (!perfume) return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true, perfume });
}

/* ---- DELETE /api/perfumes/:id ---- */
export async function DELETE(_req: Request, ctx: unknown) {
  const { id } = getParams(ctx);

  const exists = await prisma.perfume.findUnique({
    where: { id },
    select: { id: true, images: true },
  });
  if (!exists) return NextResponse.json({ ok: false, error: "No existe" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.perfumeVariant.deleteMany({ where: { perfumeId: id } });
    await tx.perfume.delete({ where: { id } });
  });

  // Limpieza opcional en S3 si tenías URLs guardadas
  const keys = toArr(exists.images as unknown).map(toKey).filter(Boolean);
  if (keys.length) {
    try { await s3DeleteMany(keys); } catch { /* ignora limpieza fallida */ }
  }

  return NextResponse.json({ ok: true });
}

/* ---- HEAD opcional para evitar 405 en preflight ---- */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
