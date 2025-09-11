// src/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";        // Prisma no corre en edge
export const dynamic = "force-dynamic"; // evita caché en mutaciones

type Params = { id: string };

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  try {
    const body = (await req.json()) as {
      shipment?: {
        tracking?: string | null;
        carrier?: string | null;
        delivered?: boolean | null;
      };
    };

    const data: Prisma.OrderUpdateInput = {
      shipment: body.shipment
        ? {
            upsert: {
              update: {
                tracking: body.shipment.tracking ?? undefined,
                carrier: body.shipment.carrier ?? undefined,
                delivered:
                  typeof body.shipment.delivered === "boolean"
                    ? body.shipment.delivered
                    : undefined,
              },
              create: {
                tracking: body.shipment.tracking ?? null,
                carrier: body.shipment.carrier ?? null,
                // delivered se crea por default en el schema si aplica
              },
            },
          }
        : undefined,
    };

    const updated = await prisma.order.update({
      where: { id: params.id },
      data,
      include: { items: true, payment: true, shipment: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
