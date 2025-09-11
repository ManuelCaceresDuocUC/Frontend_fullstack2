import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteMany } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Categoria = "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";
type PerfumeInput = {
  nombre: string; marca: string; ml: number; precio: number;
  imagenes?: string[]; categoria?: Categoria | string;
};
type ApiPerfume = {
  id: string; nombre: string; marca: string; ml: number; precio: number;
  imagenes: string[]; imagen: string | null; categoria: Categoria; createdAt: string; stock: number;
};
type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
const apiToDbCat = (c: unknown): "NICHO" | "ARABES" | "DISENADOR" | "OTROS" => {
  const u = norm(c);
  if (u === "NICHO") return "NICHO";
  if (u === "ARABES") return "ARABES";
  if (u === "DISENADOR" || u === "DISEÑADOR" || u === "DISENADOR") return "DISENADOR";
  return "OTROS";
};
const dbToApiCat = (c: string): Categoria => (c === "DISENADOR" ? "DISEÑADOR" : (c as Categoria));

const toKey = (s: string) => {
  if (!/^https?:\/\//i.test(s)) return s;
  const base = (process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  return base && s.startsWith(base + "/") ? s.slice(base.length + 1) : "";
};
const jsonToStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

const toApi = (p: {
  id: string; name: string; brand: string; ml: number; price: number; images: unknown;
  category: string; createdAt: Date; stock?: { qty: number } | null;
}): ApiPerfume => {
  const imgs = jsonToStringArray(p.images);
  return {
    id: p.id,
    nombre: p.name,
    marca: p.brand,
    ml: p.ml,
    precio: p.price,
    imagenes: imgs,
    imagen: imgs[0] ?? null,
    categoria: dbToApiCat(p.category),
    createdAt: p.createdAt.toISOString(),
    stock: p.stock?.qty ?? 0,
  };
};
type PerfumeRow = Parameters<typeof toApi>[0];

// GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const catParam = searchParams.get("categoria");
  const dbCat = catParam ? apiToDbCat(catParam) : undefined;

  if (id) {
    const p = await prisma.perfume.findUnique({ where: { id }, include: { stock: true } });
    return NextResponse.json(p ? toApi(p as unknown as PerfumeRow) : null);
  }

  const where = dbCat ? ({ category: dbCat } as unknown as Record<string, unknown>) : {};
  const list = await prisma.perfume.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    include: { stock: true },
  });
  const rows = (list as unknown as PerfumeRow[]).map((x: PerfumeRow) => toApi(x));
  return NextResponse.json(rows);
}

// POST
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Partial<PerfumeInput>;
    const name = String(b.nombre ?? "").trim();
    const brand = String(b.marca ?? "").trim();
    const ml = Number(b.ml);
    const price = Number(b.precio);
    const images = Array.isArray(b.imagenes) ? b.imagenes.filter((x): x is string => typeof x === "string") : [];
    const category = apiToDbCat(b.categoria) as unknown as never;

    if (!name || !brand) return NextResponse.json({ error: "nombre y marca son obligatorios" }, { status: 400 });
    if (!Number.isFinite(ml) || !Number.isFinite(price)) return NextResponse.json({ error: "ml y precio deben ser numéricos" }, { status: 400 });

    const created = await prisma.perfume.create({
      data: { name, brand, ml, price, images: (images as unknown as Json), category },
    });
    await prisma.stock.upsert({ where: { perfumeId: created.id }, update: {}, create: { perfumeId: created.id, qty: 0 } });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e) {
    console.error("POST /api/perfumes error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH
export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch = (await req.json()) as Partial<PerfumeInput>;
  const data: Record<string, unknown> = {};
  if (patch.nombre !== undefined) data.name = String(patch.nombre);
  if (patch.marca !== undefined) data.brand = String(patch.marca);
  if (patch.ml !== undefined) data.ml = Number(patch.ml);
  if (patch.precio !== undefined) data.price = Number(patch.precio);
  if (patch.categoria !== undefined) data.category = apiToDbCat(patch.categoria) as unknown as never;
  if (patch.imagenes !== undefined) data.images = (Array.isArray(patch.imagenes) ? patch.imagenes : []) as unknown as Json;

  const updated = await prisma.perfume.update({ where: { id }, data: data as never, include: { stock: true } });
  return NextResponse.json({ ok: true, item: toApi(updated as unknown as PerfumeRow) });
}

// DELETE
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const p = await prisma.perfume.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });

  const keys = jsonToStringArray((p as { images: unknown }).images).map(toKey).filter(Boolean);
  try { if (keys.length) await deleteMany(keys); } catch {}

  await prisma.$transaction([
    prisma.stock.delete({ where: { perfumeId: id } }).catch(() => null),
    prisma.perfume.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
