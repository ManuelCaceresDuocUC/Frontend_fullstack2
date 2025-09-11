// src/app/api/admin/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as {
    shipment?: { tracking?: string | null; carrier?: string | null; delivered?: boolean | null };
  };

  const data: Prisma.OrderUpdateInput = body.shipment
    ? {
        shipment: {
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
              delivered: body.shipment.delivered ?? false,
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
