import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PerfumeCategory } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TipoPrisma = "NICHO" | "ARABES" | "DISENADOR" | "OTROS";
type Genero = "HOMBRE" | "MUJER" | "UNISEX";

type VariantIn = { ml: number; price: number; stock?: number; active?: boolean };
type CreatePerfumeBody = {
  name: string;
  brand: string;
  ml: number;
  price: number;
  description?: string;
  images?: string[] | string;
  genero?: Genero;
  tipo?: TipoPrisma | "DISEÑADOR";
  variants?: VariantIn[];
};
function mapTipoToEnum(t?: string | null): PerfumeCategory {
  const up = (t ?? "").toUpperCase();
  if (up === "DISEÑADOR" || up === "DISENADOR") return PerfumeCategory.DISENADOR;
  if (up === "NICHO") return PerfumeCategory.NICHO;
  if (up === "ARABES") return PerfumeCategory.ARABES;
  if (up === "OTROS") return PerfumeCategory.OTROS;
  return PerfumeCategory.OTROS; // default
}
/** Normaliza entrada desde el formulario (con ñ) a enum de Prisma (sin ñ) */
function inTipo(t?: string | null): TipoPrisma | undefined {
  if (!t) return undefined;
  const up = t.toUpperCase();
  if (up === "DISEÑADOR" || up === "DISEÑADOR/DISEÑADORAS") return "DISENADOR";
  if (up === "NICHO" || up === "ARABES" || up === "OTROS" || up === "DISENADOR") return up as TipoPrisma;
  return undefined;
}
/** Normaliza salida a UI (con ñ) */
function outTipo(t?: string | null) {
  if (t === "DISENADOR") return "DISEÑADOR";
  return t ?? undefined;
}

function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

export async function GET() {
  const rows = await prisma.perfume.findMany({
    select: {
      id: true, name: true, brand: true, ml: true, price: true,
      images: true, genero: true, tipo: true,
      variants: { where: { active: true }, select: { ml: true, price: true, stock: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = rows.map((p) => {
    const imgs = Array.isArray(p.images) ? (p.images as string[]) : [];
    const v3  = p.variants.find(v => v.ml === 3);
    const v5  = p.variants.find(v => v.ml === 5);
    const v10 = p.variants.find(v => v.ml === 10);

    const candidatos = [p.price, v3?.price, v5?.price, v10?.price].filter(
      (n): n is number => typeof n === "number" && Number.isFinite(n)
    );
    const desde = candidatos.length ? Math.min(...candidatos) : p.price;

    return {
      id: p.id,
      nombre: p.name,
      marca: p.brand,
      ml: p.ml,
      precio: p.price,
      imagenes: imgs,
      genero: p.genero as Genero | undefined,
      categoria: outTipo(p.tipo),
      price3: v3?.price ?? null,
      price5: v5?.price ?? null,
      price10: v10?.price ?? null,
      desde,
    };
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  let bodyUnknown: unknown;
  try { bodyUnknown = await req.json(); } catch { bodyUnknown = {}; }
  const b = bodyUnknown as Partial<CreatePerfumeBody>;

  if (
    !b?.name ||
    !b?.brand ||
    !Number.isFinite(Number(b?.ml)) ||
    !Number.isFinite(Number(b?.price))
  ) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios (name, brand, ml, price)" },
      { status: 400 }
    );
  }

  const variantsIn: VariantIn[] | undefined =
    Array.isArray(b.variants) ? b.variants : undefined;

 const created = await prisma.perfume.create({
  data: {
    name: b.name,
    brand: b.brand,
    ml: Number(b.ml),
    price: Number(b.price),
    description: b.description ?? "",
    genero: (b.genero as "HOMBRE" | "MUJER" | "UNISEX") ?? "UNISEX",
    tipo: mapTipoToEnum(b.tipo),            // ← siempre enum válido, no undefined
    images: toArray(b.images),
    variants: variantsIn && variantsIn.length
      ? {
          create: variantsIn
            .filter(v => Number.isFinite(v.ml) && Number.isFinite(v.price))
            .map(v => ({
              ml: Number(v.ml),
              price: Number(v.price),
              stock: Number.isFinite(v.stock) ? Number(v.stock) : 0,
              active: v.active ?? true,
            })),
        }
      : undefined,
  },
  include: { variants: true },
});


  return NextResponse.json({ ok: true, perfume: created }, { status: 201 });
}
