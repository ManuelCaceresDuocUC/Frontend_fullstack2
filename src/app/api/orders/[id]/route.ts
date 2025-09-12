// src/app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // /api/orders/123 -> "123"
  const id = req.url.split("/").pop()?.split("?")[0] ?? "";
  if (!id) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    id: order.id,
    total: order.total,
    status: order.status,
    items: order.items.map(i => ({
      id: i.id,
      brand: i.brand,
      name: i.name,
      ml: i.ml,
      unitPrice: i.unitPrice,
      qty: i.qty,
    })),
  });
}
