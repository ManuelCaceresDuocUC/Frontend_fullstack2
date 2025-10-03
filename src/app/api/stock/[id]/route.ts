// src/app/api/stock/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===== helpers sin any ===== */
type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === "object" && v !== null;
const num = (o: Dict, k: string): number | undefined =>
  typeof o[k] === "number" && Number.isFinite(o[k] as number) ? (o[k] as number) : undefined;

function getParams(ctx: unknown): { id: string } {
  if (typeof ctx === "object" && ctx !== null && "params" in ctx) {
    const p = (ctx as Record<string, unknown>).params;
    if (typeof p === "object" && p !== null && "id" in (p as Record<string, unknown>)) {
      const id = (p as Record<string, unknown>).id;
      if (typeof id === "string") return { id };
    }
  }
  throw new Error("Route context inválido");
}

/* ===== tipos de body ===== */
type PatchSingle = { ml: number; stock: number };
type PatchBatch = { ml3?: number; ml5?: number; ml10?: number };

const isPatchSingle = (b: unknown): b is PatchSingle => {
  if (!isDict(b)) return false;
  const ml = num(b, "ml");
  const stock = num(b, "stock");
  return ml !== undefined && stock !== undefined;
};

const isPatchBatch = (b: unknown): b is PatchBatch => {
  if (!isDict(b)) return false;
  const v3 = num(b, "ml3");
  const v5 = num(b, "ml5");
  const v10 = num(b, "ml10");
  return v3 !== undefined || v5 !== undefined || v10 !== undefined;
};

type VariantOut = { id: string; ml: number; stock: number; price: number; active: boolean };

/* ===== GET: variantes por perfume ===== */
export async function GET(_req: Request, ctx: unknown) {
  const { id: perfumeId } = getParams(ctx);
  const variants = await prisma.perfumeVariant.findMany({
    where: { perfumeId },
    select: { id: true, ml: true, price: true, stock: true, active: true },
    orderBy: { ml: "asc" },
  });
  return NextResponse.json({ ok: true, variants });
}

/* ===== PATCH: { ml, stock } o { ml3?, ml5?, ml10? } ===== */
export async function PATCH(req: Request, ctx: unknown) {
  const { id: perfumeId } = getParams(ctx);

  let bodyUnknown: unknown = null;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  // una sola variante
  if (isPatchSingle(bodyUnknown)) {
    const { ml, stock } = bodyUnknown;
    if (ml <= 0 || stock < 0) {
      return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    }
    try {
      // requiere @@unique([perfumeId, ml]) en PerfumeVariant (ya lo tienes)
      const variant = await prisma.perfumeVariant.upsert({
        where: { perfumeId_ml: { perfumeId, ml } },
        update: { stock },
        create: { perfumeId, ml, price: 0, stock, active: true },
        select: { id: true, ml: true, stock: true, price: true, active: true },
      });
      return NextResponse.json({ ok: true, variant });
    } catch (e) {
      return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
    }
  }

  // batch 3/5/10 ml
  if (isPatchBatch(bodyUnknown)) {
    const b = bodyUnknown as PatchBatch;
    const updates: Array<{ ml: 3 | 5 | 10; stock: number }> = [];
    if (typeof b.ml3 === "number") updates.push({ ml: 3, stock: b.ml3 });
    if (typeof b.ml5 === "number") updates.push({ ml: 5, stock: b.ml5 });
    if (typeof b.ml10 === "number") updates.push({ ml: 10, stock: b.ml10 });

    if (updates.length === 0) {
      return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    }
    if (updates.some(u => u.ml <= 0 || u.stock < 0)) {
      return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
    }

    try {
      const variants: VariantOut[] = [];
      await prisma.$transaction(async (tx) => {
        for (const u of updates) {
          const v = await tx.perfumeVariant.upsert({
            where: { perfumeId_ml: { perfumeId, ml: u.ml } },
            update: { stock: u.stock },
            create: { perfumeId, ml: u.ml, price: 0, stock: u.stock, active: true },
            select: { id: true, ml: true, stock: true, price: true, active: true },
          });
          variants.push(v);
        }
      });
      return NextResponse.json({ ok: true, variants });
    } catch (e) {
      return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
}
