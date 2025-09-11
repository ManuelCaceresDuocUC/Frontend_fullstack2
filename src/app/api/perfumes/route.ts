// src/app/api/perfumes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteMany } from "@/lib/s3";
import { Prisma, type Perfume, type Perfume_category } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===== Tipos API ===== */
type CategoriaApi = "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";
type PerfumeInput = {
  nombre: string;
  marca: string;
  ml: number;
  precio: number;
  imagenes?: string[];
  categoria?: CategoriaApi | string;
};
type ApiPerfume = {
  id: string;
  nombre: string;
  marca: string;
  ml: number;
  precio: number;
  imagenes: string[];
  imagen: string | null;
  categoria: CategoriaApi;
  createdAt: string;
  stock: number;
};

/* ===== Utilidades ===== */
const norm = (s: unknown) =>
  String(s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();

const apiToDbCat = (c: unknown): Perfume_category => {
  const u = norm(c);
  if (u === "NICHO") return "NICHO";
  if (u === "ARABES") return "ARABES";
  if (u === "DISENADOR" || u === "DISEÑADOR" || u === "DISENADOR") return "DISENADOR";
  return "OTROS";
};

const dbToApiCat = (c: Perfume_category): CategoriaApi =>
  c === "DISENADOR" ? "DISEÑADOR" : (c as CategoriaApi);

const toKey = (s: string) => {
  if (!/^https?:\/\//i.test(s)) return s;
  const base = (process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  return base && s.startsWith(base + "/") ? s.slice(base.length + 1) : "";
};

const jsonToStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/* ===== Mapeo DB -> API ===== */
type PerfumeRow = Perfume & { stock?: { qty: number } | null };

const toApi = (p: PerfumeRow): ApiPerfume => {
  const imgs = jsonToStringArray(p.images as unknown);
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

/* ===== GET ===== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const catParam = searchParams.get("categoria");
  const dbCat = catParam ? apiToDbCat(catParam) : undefined;

  if (id) {
    const p = await prisma.perfume.findUnique({ where: { id }, include: { stock: true } });
    return NextResponse.json(p ? toApi(p as PerfumeRow) : null);
  }

  const where: Prisma.PerfumeWhereInput = dbCat ? { category: dbCat } : {};
  const list = await prisma.perfume.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { stock: true },
  });
  return NextResponse.json(list.map((x) => toApi(x as PerfumeRow)));
}

/* ===== POST ===== */
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Partial<PerfumeInput>;
    const name = String(b.nombre ?? "").trim();
    const brand = String(b.marca ?? "").trim();
    const ml = Number(b.ml);
    const price = Number(b.precio);
    const images = Array.isArray(b.imagenes)
      ? b.imagenes.filter((x): x is string => typeof x === "string")
      : [];
    const category = apiToDbCat(b.categoria);

    if (!name || !brand)
      return NextResponse.json({ error: "nombre y marca son obligatorios" }, { status: 400 });
    if (!Number.isFinite(ml) || !Number.isFinite(price))
      return NextResponse.json({ error: "ml y precio deben ser numéricos" }, { status: 400 });

    const imagesValue: Prisma.InputJsonValue = images; // <- tipo correcto para Prisma

    const created = await prisma.perfume.create({
      data: { name, brand, ml, price, images: imagesValue, category },
    });

    await prisma.stock.upsert({
      where: { perfumeId: created.id },
      update: {},
      create: { perfumeId: created.id, qty: 0 },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e) {
    console.error("POST /api/perfumes error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ===== PATCH ===== */
export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch = (await req.json()) as Partial<PerfumeInput>;

  const data: Prisma.PerfumeUpdateInput = {};
  if (patch.nombre !== undefined) data.name = String(patch.nombre);
  if (patch.marca !== undefined) data.brand = String(patch.marca);
  if (patch.ml !== undefined) data.ml = Number(patch.ml);
  if (patch.precio !== undefined) data.price = Number(patch.precio);
  if (patch.categoria !== undefined) data.category = apiToDbCat(patch.categoria);
  if (patch.imagenes !== undefined) {
    const imgs = Array.isArray(patch.imagenes)
      ? patch.imagenes.filter((x): x is string => typeof x === "string")
      : [];
    data.images = imgs as unknown as Prisma.InputJsonValue;
  }

  const updated = await prisma.perfume.update({
    where: { id },
    data,
    include: { stock: true },
  });

  return NextResponse.json({ ok: true, item: toApi(updated as PerfumeRow) });
}

/* ===== DELETE ===== */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const p = await prisma.perfume.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });

  const keys = jsonToStringArray((p.images as unknown)).map(toKey).filter(Boolean);
  try {
    if (keys.length) await deleteMany(keys);
  } catch {
    /* silenciar */
  }

 await prisma.$transaction(async (tx) => {
  await tx.stock.deleteMany({ where: { perfumeId: id } });
  await tx.perfume.delete({ where: { id } });
});

  return NextResponse.json({ ok: true });
}
