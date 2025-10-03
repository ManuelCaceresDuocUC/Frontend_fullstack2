// src/app/api/cart/add/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { PerfumeVariant } from "@prisma/client";

type Body = {
  productId?: string;
  variantId?: string;
  ml?: number;
  qty?: number;
  image?: string;
};

const CK = "cart_v1";

export async function POST(req: Request) {
  const { productId, variantId, ml, qty = 1, image } = (await req.json()) as Body;

  if (!variantId && !productId) {
    return NextResponse.json({ error: "falta id" }, { status: 400 });
  }

  // NO usar `await` en el tipo. Declara el tipo y asigna luego.
  let variant: (PerfumeVariant & { perfume: { id: string; name: string; brand: string } }) | null = null;

  if (variantId) {
    variant = await prisma.perfumeVariant.findUnique({
      where: { id: variantId },
      include: { perfume: { select: { id: true, name: true, brand: true } } },
    });
  } else if (productId && ml) {
    variant = await prisma.perfumeVariant.findFirst({
      where: { perfumeId: productId, ml },
      include: { perfume: { select: { id: true, name: true, brand: true } } },
    });
  }

  // Fallback legacy si aún no migras a variantes
  if (!variant && productId) {
    const p = await prisma.perfume.findUnique({ where: { id: productId }, select: { id: true, name: true, brand: true, ml: true, price: true } });
    if (!p) return NextResponse.json({ error: "producto no encontrado" }, { status: 404 });
    const perMl = p.price / Math.max(1, p.ml);
    const price = Math.ceil(perMl * (ml ?? p.ml) / 10) * 10;
    variant = {
      id: `LEGACY-${p.id}-${ml ?? p.ml}`,
      perfumeId: p.id,
      ml: ml ?? p.ml,
      price,
      stock: 9999,
      active: true,
      sku: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      perfume: { id: p.id, name: p.name, brand: p.brand },
    } as any;
  }

  if (!variant) return NextResponse.json({ error: "variante no encontrada" }, { status: 404 });
  if (!variant.active) return NextResponse.json({ error: "variante inactiva" }, { status: 400 });
  if (variant.stock < qty) return NextResponse.json({ error: "sin stock" }, { status: 400 });

  // En tu versión de Next, cookies() devuelve Promise ⇒ usa await
  const jar = await cookies();
  const raw = jar.get(CK)?.value ?? "[]";
  let current: any[] = [];
  try { current = JSON.parse(raw); } catch {}

  const idx = current.findIndex((x) => x.variantId === variant!.id);
  if (idx >= 0) current[idx].qty += qty;
  else
    current.push({
      productId: variant.perfumeId,
      variantId: variant.id,
      name: (variant as any).perfume.name,
      brand: (variant as any).perfume.brand,
      ml: variant.ml,
      unitPrice: variant.price,
      qty,
      image: image ?? null,
    });

  const res = NextResponse.json(
    { ok: true, count: current.reduce((a, b) => a + b.qty, 0) },
    { status: 200 }
  );

  res.cookies.set(CK, JSON.stringify(current), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
