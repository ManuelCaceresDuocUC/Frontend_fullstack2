// src/app/api/perfumes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Normaliza entrada desde el formulario (con ñ) a enum de Prisma (sin ñ) */
function inTipo(t?: string | null) {
  if (!t) return undefined;
  const up = t.toUpperCase();
  if (up === "DISEÑADOR" || up === "DISEÑADOR/DISEÑADORAS") return "DISENADOR";
  return up; // NICHO | ARABES | OTROS | DISENADOR
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

    // “desde” = mínimo entre frasco y variantes activas (si existen)
    const candidatos = [p.price, v3?.price, v5?.price, v10?.price].filter((n): n is number => Number.isFinite(n));
    const desde = candidatos.length ? Math.min(...candidatos) : p.price;

    return {
      id: p.id,
      nombre: p.name,
      marca: p.brand,
      ml: p.ml,
      precio: p.price,
      imagenes: imgs,
      genero: p.genero,
      categoria: outTipo(p.tipo),
      // para la tarjeta:
      price3: v3?.price ?? null,
      price5: v5?.price ?? null,
      price10: v10?.price ?? null,
      desde,
    };
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  // Crear perfume
  const body = await req.json().catch(() => ({} as any));
  const {
    name, brand, ml, price, description,
    images, genero, tipo,
    variants,
  } = body ?? {};

  if (!name || !brand || !Number.isFinite(ml) || !Number.isFinite(price)) {
    return NextResponse.json({ error: "Faltan campos obligatorios (name, brand, ml, price)" }, { status: 400 });
  }

  const created = await prisma.perfume.create({
    data: {
      name,
      brand,
      ml: Number(ml),
      price: Number(price),
      description: description ?? "",
      genero: genero ?? "UNISEX",
      tipo: inTipo(tipo) as any, // NICHO | ARABES | DISENADOR | OTROS
      images: toArray(images),
      variants: variants?.length
        ? {
            create: (variants as Array<{ ml: number; price: number; stock?: number; active?: boolean }>)
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
