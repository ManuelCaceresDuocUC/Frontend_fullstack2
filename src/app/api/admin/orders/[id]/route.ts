// src/app/api/admin/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as {
      shipment?: {
        tracking?: string | null;
        carrier?: string | null;
        delivered?: boolean | null;
      };
      // otros campos de order si aplican
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
                // delivered tiene default false, opcional
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
