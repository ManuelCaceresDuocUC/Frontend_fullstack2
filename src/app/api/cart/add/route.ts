// src/app/api/cart/add/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const CK = "cart_v1";

type Body = {
  productId?: string;
  variantId?: string;
  ml?: number;
  qty?: number;
  image?: string | null;
};

type VariantCore = {
  id: string;
  perfumeId: string;
  ml: number;
  price: number;
  stock: number;
  active: boolean;
  perfume: { id: string; name: string; brand: string };
};

type CartCookieItem = {
  productId: string;
  variantId: string;
  name: string;
  brand: string;
  ml: number;
  unitPrice: number;
  qty: number;
  image: string | null;
};

function isCartCookieItem(x: unknown): x is CartCookieItem {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.productId === "string" &&
    typeof r.variantId === "string" &&
    typeof r.name === "string" &&
    typeof r.brand === "string" &&
    typeof r.ml === "number" &&
    typeof r.unitPrice === "number" &&
    typeof r.qty === "number" &&
    (typeof r.image === "string" || r.image === null)
  );
}

function parseCart(raw: string | undefined): CartCookieItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartCookieItem);
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const { productId, variantId, ml, qty = 1, image = null } = (await req.json()) as Body;
  if (!variantId && !productId) return NextResponse.json({ error: "falta id" }, { status: 400 });

  let variant: VariantCore | null = null;

  if (variantId) {
    const v = await prisma.perfumeVariant.findUnique({
      where: { id: variantId },
      include: { perfume: { select: { id: true, name: true, brand: true } } },
    });
    if (v) {
      variant = {
        id: v.id,
        perfumeId: v.perfumeId,
        ml: v.ml,
        price: v.price,
        stock: v.stock,
        active: v.active,
        perfume: v.perfume,
      };
    }
  } else if (productId && typeof ml === "number") {
    const v = await prisma.perfumeVariant.findFirst({
      where: { perfumeId: productId, ml },
      include: { perfume: { select: { id: true, name: true, brand: true } } },
    });
    if (v) {
      variant = {
        id: v.id,
        perfumeId: v.perfumeId,
        ml: v.ml,
        price: v.price,
        stock: v.stock,
        active: v.active,
        perfume: v.perfume,
      };
    }
  }

  // Legacy por frasco completo
  if (!variant && productId) {
    const p = await prisma.perfume.findUnique({
      where: { id: productId },
      select: { id: true, name: true, brand: true, ml: true, price: true },
    });
    if (!p) return NextResponse.json({ error: "producto no encontrado" }, { status: 404 });
    const perMl = p.price / Math.max(1, p.ml);
    const useMl = typeof ml === "number" ? ml : p.ml;
    const price = Math.ceil((perMl * useMl) / 10) * 10;
    variant = {
      id: `LEGACY-${p.id}-${useMl}`,
      perfumeId: p.id,
      ml: useMl,
      price,
      stock: 9999,
      active: true,
      perfume: { id: p.id, name: p.name, brand: p.brand },
    };
  }

  if (!variant) return NextResponse.json({ error: "variante no encontrada" }, { status: 404 });
  if (!variant.active) return NextResponse.json({ error: "variante inactiva" }, { status: 400 });
  if (variant.stock < qty) return NextResponse.json({ error: "sin stock" }, { status: 400 });

  const jar = await cookies();
  const current = parseCart(jar.get(CK)?.value);

  const idx = current.findIndex((x) => x.variantId === variant!.id);
  if (idx >= 0) {
    current[idx] = { ...current[idx], qty: current[idx].qty + qty };
  } else {
    current.push({
      productId: variant.perfumeId,
      variantId: variant.id,
      name: variant.perfume.name,
      brand: variant.perfume.brand,
      ml: variant.ml,
      unitPrice: variant.price,
      qty,
      image,
    });
  }

  const count = current.reduce((a, b) => a + b.qty, 0);

  const res = NextResponse.json({ ok: true, count }, { status: 200 });
  res.cookies.set(CK, JSON.stringify(current), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
