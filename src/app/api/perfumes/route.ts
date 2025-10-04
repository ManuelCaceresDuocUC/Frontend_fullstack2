// src/app/api/perfumes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, PerfumeCategory, Genero } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===== Tipos API ===== */
type CategoriaApi = "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";
type GeneroApi = "HOMBRE" | "MUJER" | "UNISEX";

type VariantIn = { ml: number; price: number; stock?: number; active?: boolean };

type PerfumeInput = {
  nombre: string;
  marca: string;
  ml: number;
  precio: number;
  imagenes?: string[];
  categoria?: CategoriaApi | string;
  genero?: GeneroApi | string;
  descripcion?: string;
  variants?: VariantIn[];
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
  genero: GeneroApi;
  createdAt: string;
  stock: number;
  descripcion: string;

  // NUEVO: precios y stock por decants
  price3?: number | null;
  price5?: number | null;
  price10?: number | null;
  stock3?: number | null;
  stock5?: number | null;
  stock10?: number | null;
};

type PerfumeWithVariants = Prisma.PerfumeGetPayload<{ include: { variants: true } }>;

/* ===== Utils ===== */
const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();

const cleanDesc = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.replace(/\u0000/g, "").trim();
  return t ? t.slice(0, 10_000) : null;
};

const roundCLP = (n: number) => Math.ceil(n / 10) * 10;

const apiToDbCat = (c: unknown): PerfumeCategory => {
  const u = norm(c);
  if (u === "NICHO") return "NICHO";
  if (u === "ARABES") return "ARABES";
  if (u === "DISENADOR" || u === "DISEÑADOR" || u === "DISENADOR") return "DISENADOR"; // “DISEÑADOR”
  return "OTROS";
};

const dbToApiCat = (c: PerfumeCategory): CategoriaApi =>
  c === "DISENADOR" ? "DISEÑADOR" : (c as CategoriaApi);

const apiToDbGenero = (g: unknown): Genero => {
  const u = norm(g);
  if (u === "HOMBRE") return "HOMBRE";
  if (u === "MUJER") return "MUJER";
  return "UNISEX";
};

const dbToApiGenero = (g: Genero): GeneroApi => g as GeneroApi;

const jsonToStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/* ===== Mapeo ===== */
const toApi = (p: PerfumeWithVariants): ApiPerfume => {
  const imgs = jsonToStringArray(p.images as unknown);

  // variantes 3/5/10 activas
  const v3 = p.variants.find(v => v.ml === 3 && v.active);
  const v5 = p.variants.find(v => v.ml === 5 && v.active);
  const v10 = p.variants.find(v => v.ml === 10 && v.active);

  // fallback de precio por ml (si falta price en la variante)
  const perMl = p.price > 0 && p.ml > 0 ? p.price / p.ml : 0;

  const price3 = v3 ? (v3.price > 0 ? v3.price : roundCLP(perMl * 3)) : null;
  const price5 = v5 ? (v5.price > 0 ? v5.price : roundCLP(perMl * 5)) : null;
  const price10 = v10 ? (v10.price > 0 ? v10.price : roundCLP(perMl * 10)) : null;

  const stock3 = v3?.stock ?? null;
  const stock5 = v5?.stock ?? null;
  const stock10 = v10?.stock ?? null;

  const stockTotal =
    Number(stock3 ?? 0) + Number(stock5 ?? 0) + Number(stock10 ?? 0);

  return {
    id: p.id,
    nombre: p.name,
    marca: p.brand,
    ml: p.ml,
    precio: p.price,
    imagenes: imgs,
    imagen: imgs[0] ?? null,
    categoria: dbToApiCat(p.tipo),
    genero: dbToApiGenero(p.genero),
    createdAt: p.createdAt.toISOString(),
    stock: stockTotal,
    descripcion: p.description ?? "",

    price3,
    price5,
    price10,
    stock3,
    stock5,
    stock10,
  };
};

/* ===== GET /api/perfumes[?categoria][&genero] ===== */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const catParam = searchParams.get("categoria");
  const genParam = searchParams.get("genero");

  const where: Prisma.PerfumeWhereInput = {};
  if (catParam) where.tipo = apiToDbCat(catParam);
  if (genParam) where.genero = apiToDbGenero(genParam);

  const list = await prisma.perfume.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { variants: true },
  });

  return NextResponse.json(list.map((x) => toApi(x)));
}

/* ===== POST /api/perfumes ===== */
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
    const tipo = apiToDbCat(b.categoria);
    const genero = apiToDbGenero(b.genero);
    const description = cleanDesc(b.descripcion);

    if (!name || !brand) {
      return NextResponse.json({ error: "nombre y marca son obligatorios" }, { status: 400 });
    }
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
        genero,
        description,
      },
    });

    // Crear variantes si vienen
    const variantsIn: VariantIn[] = Array.isArray(b.variants) ? b.variants : [];
    if (variantsIn.length) {
      await prisma.perfumeVariant.createMany({
        data: variantsIn.map((v) => ({
          perfumeId: created.id,
          ml: Number(v.ml) || 0,
          price: Number(v.price) || 0,
          stock: Number(v.stock ?? 0),
          active: v.active === false ? false : true,
        })),
      });
    }

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e) {
    const msg =
      e instanceof Prisma.PrismaClientKnownRequestError
        ? `${e.code}: ${e.message}`
        : e instanceof Error
        ? e.message
        : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ===== PATCH /api/perfumes?id=... ===== */
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
    const imgs = Array.isArray(patch.imagenes)
      ? patch.imagenes.filter((x): x is string => typeof x === "string")
      : [];
    data.images = imgs as unknown as Prisma.InputJsonValue;
  }
  if (patch.descripcion !== undefined) data.description = cleanDesc(patch.descripcion);

  const updated = await prisma.perfume.update({
    where: { id },
    data,
    include: { variants: true },
  });

  // Si llegan variants en PATCH -> reemplazo simple
  if (Array.isArray(patch.variants)) {
    await prisma.$transaction([
      prisma.perfumeVariant.deleteMany({ where: { perfumeId: id } }),
      prisma.perfumeVariant.createMany({
        data: patch.variants.map((v) => ({
          perfumeId: id,
          ml: Number(v.ml) || 0,
          price: Number(v.price) || 0,
          stock: Number(v.stock ?? 0),
          active: v.active === false ? false : true,
        })),
      }),
    ]);
  }

  return NextResponse.json({ ok: true, item: toApi(updated) });
}
