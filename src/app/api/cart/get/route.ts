// src/app/api/cart/get/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const CK = "cart_v1";

export async function GET() {
  const jar = await cookies();                // <- clave
  const raw = jar.get(CK)?.value ?? "[]";

  let items: Array<{ unitPrice?: number; price?: number; qty?: number }> = [];
  try { items = JSON.parse(raw); } catch {}

  const subtotal = items.reduce(
    (s, x) => s + ((x.unitPrice ?? x.price ?? 0) * (x.qty ?? 1)),
    0
  );

  return NextResponse.json({ items, subtotal });
}
