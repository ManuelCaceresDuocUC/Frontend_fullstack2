// src/app/api/perfumes/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

import { deleteMany } from "@/lib/s3"; // ahora sí existe
export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const toKey = (s: string) => {
  if (!/^https?:\/\//i.test(s)) return s;
  const base = (process.env.S3_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
  return base && s.startsWith(base + "/") ? s.slice(base.length + 1) : "";
};

// Nota: NO tipar estrictamente el segundo arg. Usa `any` para evitar el fallo del validador de Next.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: NextRequest, { params }: any) {
  const { id } = params as { id: string };

  const p = await prisma.perfume.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });

  const keys = arr(p.images as unknown).map(toKey).filter(Boolean);
  try { if (keys.length) await deleteMany(keys); } catch {}

  await prisma.$transaction(async (tx) => {
    await tx.stock.deleteMany({ where: { perfumeId: id } });
    await tx.perfume.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
