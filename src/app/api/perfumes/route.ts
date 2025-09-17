// src/app/api/perfumes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, type Perfume, type Perfume_category, type Genero, type Stock } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Tipos API */
type CategoriaApi = "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";
type GeneroApi = "HOMBRE" | "MUJER" | "UNISEX";

type PerfumeInput = {
  nombre: string;
  marca: string;
  ml: number;
  precio: number;
  imagenes?: string[];
  categoria?: CategoriaApi | string;
  genero?: GeneroApi | string;
  descripcion?: string;
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
  descripcion: string;
};

/* Utils */
const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();

const apiToDbCat = (c: unknown): Perfume_category => {
  const u = norm(c);
  if (u === "NICHO") return "NICHO";
  if (u === "ARABES") return "ARABES";
  if (u === "DISENADOR") return "DISENADOR"; // “DISEÑADOR” → “DISENADOR”
  return "OTROS";
};

const dbToApiCat = (c: Perfume_category): CategoriaApi =>
  c === "DISENADOR" ? "DISEÑADOR" : (c as CategoriaApi);

const apiToDbGenero = (g: unknown): Genero => {
  const u = norm(g); // "hombre" → "HOMBRE"
  if (u === "HOMBRE") return "HOMBRE";
  if (u === "MUJER") return "MUJER";
  return "UNISEX";
};

const jsonToStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/* Mapeo */
type PerfumeRow = Perfume & { Stock?: Stock | null };

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
    categoria: dbToApiCat(p.tipo),
    createdAt: p.createdAt.toISOString(),
    stock: p.Stock?.qty ?? 0,
    descripcion: p.description ?? "",
  };
};

/* GET /api/perfumes[?id][&categoria][&genero] */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const catParam = searchParams.get("categoria");
  const genParam = searchParams.get("genero");

  if (id) {
    const p = await prisma.perfume.findUnique({
      where: { id },
      include: { Stock: true },
    });
    return NextResponse.json(p ? toApi(p as PerfumeRow) : null);
  }

  const where: Prisma.PerfumeWhereInput = {};
  if (catParam) where.tipo = apiToDbCat(catParam);
  if (genParam) where.genero = apiToDbGenero(genParam);

  const list = await prisma.perfume.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { Stock: true },
  });
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
    const tipo = apiToDbCat(b.categoria);
    const genero = apiToDbGenero(b.genero);
    const description = typeof b.descripcion === "string" ? b.descripcion.trim() : "";

    if (!name || !brand) return NextResponse.json({ error: "nombre y marca son obligatorios" }, { status: 400 });
    if (!Number.isFinite(ml) || ml <= 0 || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "ml y precio inválidos" }, { status: 400 });
    }

    const created = await prisma.perfume.create({
      data: {
        name,
        brand,
        ml,
        price,
        images: images as unknown as Prisma.InputJsonValue,
        tipo,
        genero, // guarda género
        description,
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
  if (patch.categoria !== undefined) data.tipo = apiToDbCat(patch.categoria);
  if (patch.genero !== undefined) data.genero = apiToDbGenero(patch.genero);
  if (patch.imagenes !== undefined) {
    const imgs = Array.isArray(patch.imagenes) ? patch.imagenes.filter((x): x is string => typeof x === "string") : [];
    data.images = imgs as unknown as Prisma.InputJsonValue;
  }
  if (patch.descripcion !== undefined) data.description = String(patch.descripcion);

  const updated = await prisma.perfume.update({
    where: { id },
    data,
    include: { Stock: true },
  });
  return NextResponse.json({ ok: true, item: toApi(updated as PerfumeRow) });
}

/* Nota: DELETE está en /api/perfumes/[id]/route.ts */
