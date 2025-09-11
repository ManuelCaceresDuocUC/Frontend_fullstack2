// src/app/api/admin/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Tipo amplio que Next acepta para params
type RouteCtx = { params: Record<string, string | string[]> };

export const PATCH: (req: Request, ctx: RouteCtx) => Promise<Response> = async (req, { params }) => {
  const id = String(params.id);
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    const body = (await req.json()) as {
      shipment?: { tracking?: string | null; carrier?: string | null; delivered?: boolean | null };
    };

    const data: Prisma.OrderUpdateInput = {
      shipment: body.shipment
        ? {
            upsert: {
              update: {
                tracking: body.shipment.tracking ?? undefined,
                carrier: body.shipment.carrier ?? undefined,
                delivered:
                  typeof body.shipment.delivered === "boolean" ? body.shipment.delivered : undefined,
              },
              create: {
                tracking: body.shipment.tracking ?? null,
                carrier: body.shipment.carrier ?? null,
              },
            },
          }
        : undefined,
    };

    const updated = await prisma.order.update({
      where: { id },
      data,
      include: { items: true, payment: true, shipment: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
};
