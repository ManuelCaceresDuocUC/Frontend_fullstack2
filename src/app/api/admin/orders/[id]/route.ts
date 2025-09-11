// src/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };
type ShipmentPayload = Partial<{
  tracking: string | null;
  carrier: string | null;
  delivered: boolean | null;
}>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const body = (await req.json()) as { shipment?: ShipmentPayload };
  const sp = body.shipment;

  const data: Prisma.OrderUpdateInput = sp
    ? {
        shipment: {
          upsert: {
            update: {
              tracking: sp.tracking ?? undefined,
              carrier: sp.carrier ?? undefined,
              delivered: typeof sp.delivered === "boolean" ? sp.delivered : undefined,
            },
            create: {
              tracking: sp.tracking ?? null,
              carrier: sp.carrier ?? null,
              delivered: sp.delivered ?? false,
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
}
