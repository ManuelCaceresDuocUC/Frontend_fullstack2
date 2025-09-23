// src/app/api/admin/orders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        buyerName: true,
        email: true,
        total: true,
        status: true,
        payment: { select: { method: true, status: true } },
        // shipment: status ❌  -> usa delivered ✅
        shipment: { select: { tracking: true, carrier: true, delivered: true } },
        // shipping ❌ no existe. Selecciona campos planos ✅
        shippingStreet: true,
        shippingCity: true,
        shippingRegion: true,
        shippingZip: true,
        shippingNotes: true,
        items: {
          select: {

            
            id: true,
            perfumeId: true,
            name: true,
            brand: true,
            ml: true,
            unitPrice: true,
            qty: true,
          },
        },
      },
      take: 200,
    });

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/admin/orders error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
