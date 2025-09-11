// src/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };
type ShipmentPayload = Partial<{
  tracking: string | null;
  trackingCode: string | null;
  carrier: string | null;
  delivered: boolean | null; // quita si no existe en tu schema
}>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  try {
    const body = (await req.json()) as { shipment?: ShipmentPayload };
    const sp = body.shipment;

    const tracking = sp?.tracking ?? sp?.trackingCode ?? null;

    const data: Prisma.OrderUpdateInput = sp
      ? {
          shipment: {
            upsert: {
              update: {
                tracking: tracking ?? undefined,
                carrier: sp.carrier ?? undefined,
                // elimina esta línea si tu modelo Shipment no tiene 'delivered'
                delivered: typeof sp.delivered === "boolean" ? sp.delivered : undefined,
              },
              create: {
                tracking,
                carrier: sp.carrier ?? null,
                // idem 'delivered' aquí si aplica
              },
            },
          },
        }
      : {};

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
