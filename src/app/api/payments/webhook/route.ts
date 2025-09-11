// src/app/api/payments/webhook/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus, OrderStatus } from "@prisma/client";

type PaymentState = "PAID" | "FAILED" | "AUTHORIZED" | "INITIATED";
type Normalized = { orderId: string; providerRef: string | null; status: PaymentState };

type ProviderPayload = Partial<{
  orderId: unknown;
  status: unknown;
  tx: unknown;
  token: unknown;
  providerRef: unknown;
  providerTxId: unknown;
}>;

function normalizeProviderPayload(payload: unknown): Normalized {
  let orderId = "";
  let providerRef: string | null = null;
  let status: PaymentState = "FAILED";

  if (typeof payload === "object" && payload !== null) {
    const p = payload as ProviderPayload;

    // orderId
    if (typeof p.orderId === "string") orderId = p.orderId;
    else if (p.orderId != null) orderId = String(p.orderId);

    // providerRef candidates
    const ref =
      (typeof p.tx === "string" && p.tx) ||
      (typeof p.token === "string" && p.token) ||
      (typeof p.providerRef === "string" && p.providerRef) ||
      (typeof p.providerTxId === "string" && p.providerTxId) ||
      null;
    providerRef = ref;

    // status
    const s = typeof p.status === "string" ? p.status.toUpperCase() : "";
    status = s === "PAID" || s === "AUTHORIZED" || s === "INITIATED" ? (s as PaymentState) : "FAILED";
  }

  if (!orderId) throw new Error("orderId missing");
  return { orderId, providerRef, status };
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as unknown;
    const { orderId, providerRef, status } = normalizeProviderPayload(payload);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, items: true },
    });
    if (!order) return NextResponse.json({ ok: true });

    const isPaid = status === "PAID" || status === "AUTHORIZED";

    await prisma.payment.update({
      where: { orderId },
      data: {
        status: isPaid ? PaymentStatus.PAID : PaymentStatus.FAILED,
        providerTxId: providerRef ?? undefined,
      },
    });

    if (isPaid) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });
      await prisma.shipment.upsert({
        where: { orderId },
        update: {},
        create: {
          orderId,
          carrier: "Pendiente",
          tracking: makeTracking(orderId),
        },
      });
    } else {
      await Promise.all(
        order.items.map((line) =>
          prisma.stock
            .update({
              where: { perfumeId: line.perfumeId },
              data: { qty: { increment: line.qty } },
            })
            .catch(() => null)
        )
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function makeTracking(id: string) {
  return "MF-" + id.slice(0, 6).toUpperCase();
}
