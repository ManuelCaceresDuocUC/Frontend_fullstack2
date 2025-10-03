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
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // opcional: validar existencia
  const exists = await prisma.perfume.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Antes borrábamos tx.stock.deleteMany; ahora son variantes
    await tx.perfumeVariant.deleteMany({ where: { perfumeId: id } });
    await tx.perfume.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}