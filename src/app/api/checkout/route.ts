// src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CK = "cart";

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

function parseCart(raw?: string): CartCookieItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartCookieItem);
  } catch {
    return [];
  }
}

type LineCreate = {
  perfumeId: string;
  variantId: string;
  name: string;
  brand: string;
  ml: number;
  unitPrice: number;
  qty: number;
};

export async function POST(req: Request) {
  // Lee carrito
  const jar = await cookies();
  const cart = parseCart(jar.get(CK)?.value);
  if (cart.length === 0) {
    return NextResponse.json({ error: "carrito vacío" }, { status: 400 });
  }

  // Carga variantes
  const ids = cart.map((c) => c.variantId);
  const variants = await prisma.perfumeVariant.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      perfumeId: true,
      ml: true,
      price: true,
      stock: true,
      active: true,
      perfume: { select: { name: true, brand: true } },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  // Valida y arma líneas con precios de la BD
  const lines: LineCreate[] = cart.map((c): LineCreate => {
    const v = byId.get(c.variantId);
    if (!v) throw new Error("variante no encontrada");
    if (!v.active) throw new Error("variante inactiva");
    if (v.stock < c.qty) throw new Error("sin stock");
    return {
      perfumeId: v.perfumeId,
      variantId: v.id,
      name: v.perfume.name,
      brand: v.perfume.brand,
      ml: v.ml,
      unitPrice: v.price,
      qty: c.qty,
    };
  });

  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const shippingFee = 0; // ajusta tu lógica de envío
  const total = subtotal + shippingFee;

  // Datos del comprador (opcionales en body)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const b = (body as Record<string, unknown>) || {};
  const email = String(b.email ?? "");
  const buyerName = String(b.buyerName ?? "");
  const phone = String(b.phone ?? "");
  const shippingStreet = String(b.shippingStreet ?? "");
  const shippingCity = String(b.shippingCity ?? "");
  const shippingRegion = String(b.shippingRegion ?? "");
  const shippingZip = String(b.shippingZip ?? "");
  const shippingNotes = String(b.shippingNotes ?? "");

  // Transacción: crea orden y descuenta stock
  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        email,
        buyerName,
        phone,
        shippingStreet,
        shippingCity,
        shippingRegion,
        shippingZip,
        shippingNotes,
        subtotal,
        shippingFee,
        total,
        items: { create: lines },
        payment: {
          create: {
            method: PaymentMethod.WEBPAY,
            status: PaymentStatus.INITIATED,
            amount: total,
          },
        },
      },
      select: { id: true },
    });

    await Promise.all(
      lines.map((line) =>
        tx.perfumeVariant.update({
          where: { id: line.variantId },
          data: { stock: { decrement: line.qty } },
        })
      )
    );

    return order;
  });

  // Respuesta mínima para continuar con Webpay u otro flujo
  return NextResponse.json({ id: created.id, total }, { status: 200 });
}
