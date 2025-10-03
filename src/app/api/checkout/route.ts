// src/app/api/checkout/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const CK = "cart_v1";

type CartCookieItem = {
  productId: string;      // Perfume.id
  variantId: string;      // PerfumeVariant.id | LEGACY-...
  name: string;
  brand: string;
  ml: number;
  unitPrice: number;      // CLP
  qty: number;
  image: string | null;
};

type CheckoutBody = {
  email: string;
  buyerName: string;
  phone?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingRegion?: string;
  shippingZip?: string;
  shippingNotes?: string;
  shippingFee?: number;                 // opcional, si no se manda se calcula simple
  paymentMethod?: "WEBPAY" | "MANUAL" | "SERVIPAG";
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

const safeInt = (n: number) => Math.max(0, Math.trunc(n));

export async function POST(req: Request) {
  const body = (await req.json()) as CheckoutBody;

  // 1) Cargar carrito desde cookie
  const jar = await cookies();
  const items = parseCart(jar.get(CK)?.value);
  if (items.length === 0) {
    return NextResponse.json({ error: "carrito_vacio" }, { status: 400 });
  }

  // 2) Totales
  const subtotal = items.reduce((s, it) => s + safeInt(it.unitPrice) * safeInt(it.qty), 0);
  const region = body.shippingRegion ?? "";
  const fallbackShip = region === "Valparaíso" ? 2000 : 3990;   // regla simple
  const shippingFee = typeof body.shippingFee === "number" ? safeInt(body.shippingFee) : fallbackShip;
  const total = subtotal + shippingFee;

  // 3) Descuento de stock y creación de orden en una transacción
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 3.a) Mapear necesidad por variante real (ignora LEGACY)
      const needByVariant = items
        .filter((i) => i.variantId && !i.variantId.startsWith("LEGACY"))
        .reduce<Record<string, number>>((acc, i) => {
          acc[i.variantId] = (acc[i.variantId] ?? 0) + safeInt(i.qty);
          return acc;
        }, {});

      // 3.b) Descontar stock de manera atómica
      const updates = await Promise.all(
        Object.entries(needByVariant).map(([variantId, need]) =>
          tx.perfumeVariant.updateMany({
            where: { id: variantId, stock: { gte: need } },
            data: { stock: { decrement: need } },
          })
        )
      );
      if (updates.some((u) => u.count !== 1)) {
        throw new Error("stock_insuficiente");
      }

      // 3.c) Crear Order + OrderItems + Payment
      const order = await tx.order.create({
        data: {
          email: body.email,
          buyerName: body.buyerName,
          phone: body.phone ?? "",
          shippingStreet: body.shippingStreet ?? "",
          shippingCity: body.shippingCity ?? "",
          shippingRegion: region,
          shippingZip: body.shippingZip ?? "",
          shippingNotes: body.shippingNotes ?? "",
          subtotal,
          shippingFee,
          total,
          // items
          items: {
            create: items.map((it) => ({
              perfumeId: it.productId,
              variantId: it.variantId.startsWith("LEGACY") ? null : it.variantId,
              name: it.name,
              brand: it.brand,
              ml: safeInt(it.ml),
              unitPrice: safeInt(it.unitPrice),
              qty: safeInt(it.qty),
            })),
          },
          // payment
          payment: {
            create: {
              method: (body.paymentMethod ?? "WEBPAY") as any,
              amount: total,
            },
          },
          // shipment placeholder
          shipment: {
            create: {
              carrier: region === "Valparaíso" ? "Despacho propio" : "Bluexpress",
            },
          },
        },
        select: { id: true, total: true },
      });

      return order;
    });

    // 4) Limpiar cookie y responder
    const res = NextResponse.json({ ok: true, orderId: result.id, total: result.total });
    res.cookies.set(CK, "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "stock_insuficiente") {
      return NextResponse.json({ error: "stock_insuficiente" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
