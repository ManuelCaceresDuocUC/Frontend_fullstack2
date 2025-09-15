// src/app/api/perfumes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, type Perfume, type Perfume_category } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* tipos */
type CategoriaApi = "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";
type PerfumeInput = {
  nombre: string;
  marca: string;
  ml: number;
  precio: number;
  imagenes?: string[];
  categoria?: CategoriaApi | string;
  descripcion?: string;                 // ← NUEVO
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
  descripcion: string;                  // ← NUEVO
};

/* utils */
const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
const apiToDbCat = (c: unknown): Perfume_category => {
  const u = norm(c);
  if (u === "NICHO") return "NICHO";
  if (u === "ARABES") return "ARABES";
  if (u === "DISENADOR" || u === "DISEÑADOR" || u === "DISENADOR") return "DISENADOR";
  return "OTROS";
};
const dbToApiCat = (c: Perfume_category): CategoriaApi => (c === "DISENADOR" ? "DISEÑADOR" : (c as CategoriaApi));
const jsonToStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/* mapeo */
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
    descripcion: p.description ?? "",      // ← NUEVO
  };
};

/* GET /api/perfumes[?id][&categoria] */
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
  const list = await prisma.perfume.findMany({ where, orderBy: { createdAt: "desc" }, include: { stock: true } });
  return NextResponse.json(list.map((x) => toApi(x as PerfumeRow)));
}

/* POST /api/perfumes */
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Partial<PerfumeInput>;
    const name = String(b.nombre ?? "").trim();
    const brand = String(b.marca ?? "").trim();
    const ml = Number(b.ml);
    const price = Number(b.precio);
    const images = Array.isArray(b.imagenes) ? b.imagenes.filter((x): x is string => typeof x === "string") : [];
    const category = apiToDbCat(b.categoria);
    const description = typeof b.descripcion === "string" ? b.descripcion.trim() : ""; // ← NUEVO

    if (!name || !brand) return NextResponse.json({ error: "nombre y marca son obligatorios" }, { status: 400 });
    if (!Number.isFinite(ml) || !Number.isFinite(price)) {
      return NextResponse.json({ error: "ml y precio deben ser numéricos" }, { status: 400 });
    }

    const created = await prisma.perfume.create({
      data: {
        name,
        brand,
        ml,
        price,
        images: images as unknown as Prisma.InputJsonValue,
        category,
        description, // ← NUEVO
      },
    });

    await prisma.stock.upsert({
      where: { perfumeId: created.id },
      update: {},
      create: { perfumeId: created.id, qty: 0 },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e: unknown) {
    let msg = "error";
    if (e instanceof Prisma.PrismaClientKnownRequestError) msg = `${e.code}: ${e.message}`;
    else if (e instanceof Error) msg = e.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* PATCH /api/perfumes?id=... */
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
    const imgs = Array.isArray(patch.imagenes) ? patch.imagenes.filter((x): x is string => typeof x === "string") : [];
    data.images = imgs as unknown as Prisma.InputJsonValue;
  }
  if (patch.descripcion !== undefined) data.description = String(patch.descripcion); // ← NUEVO

  const updated = await prisma.perfume.update({ where: { id }, data, include: { stock: true } });
  return NextResponse.json({ ok: true, item: toApi(updated as PerfumeRow) });
}

/* Nota: DELETE está en /api/perfumes/[id]/route.ts */
