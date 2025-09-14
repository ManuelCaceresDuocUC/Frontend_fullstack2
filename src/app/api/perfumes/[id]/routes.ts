// src/app/api/perfumes/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteMany } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** helpers */
const jsonToStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const toKey = (s: string) => {
  if (!/^https?:\/\//i.test(s)) return s;
  const base = (process.env.S3_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
  return base && s.startsWith(base + "/") ? s.slice(base.length + 1) : "";
};

/** DELETE /api/perfumes/:id */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const p = await prisma.perfume.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });

  const keys = jsonToStringArray(p.images as unknown).map(toKey).filter(Boolean);
  try { if (keys.length) await deleteMany(keys); } catch { /* ignora errores de S3 */ }

  await prisma.$transaction(async (tx) => {
    await tx.stock.deleteMany({ where: { perfumeId: id } });
    await tx.perfume.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
