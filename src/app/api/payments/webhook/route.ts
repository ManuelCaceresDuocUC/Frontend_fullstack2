// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];
type PaymentState = "PAID" | "FAILED" | "AUTHORIZED" | "INITIATED";
type Normalized = { orderId: string; providerRef: string | null; status: PaymentState };

function normalizeProviderPayload(payload: unknown): Normalized {
  let orderId = "";
  let providerRef: string | null = null;
  let status: PaymentState = "FAILED";

  if (typeof payload === "object" && payload !== null) {
    const p = payload as Record<string, unknown>;
    orderId = String(p.orderId ?? "");
    const tx = p.tx ?? p.token;
    providerRef = typeof tx === "string" ? tx : null;

    const s = String(p.status ?? "").toUpperCase();
    if (s === "PAID" || s === "AUTHORIZED" || s === "INITIATED") status = s;
    else status = "FAILED";
  }
  if (!orderId) throw new Error("orderId missing");
  return { orderId, providerRef, status };
}

export async function POST(req: Request) {
  const payload = (await req.json()) as unknown;

  const { orderId, providerRef, status } = normalizeProviderPayload(payload);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, items: true },
  });
  if (!order) return NextResponse.json({ ok: true });

  const paid = status === "PAID" || status === "AUTHORIZED";

  await prisma.payment.update({
    where: { orderId },
    data: {
      status: paid ? "PAID" : "FAILED",
      providerRef: providerRef ?? undefined,
      raw: payload as Json,
    },
  });

  if (paid) {
    await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
    await prisma.shipment.upsert({
      where: { orderId },
      update: {},
      create: { orderId, carrier: "Pendiente", tracking: makeTracking(orderId), status: "Preparando" },
    });
  } else {
    // devolver stock reservado
    await Promise.all(
      order.items.map((line: { perfumeId: string; qty: number }) =>
        prisma.stock
          .update({ where: { perfumeId: line.perfumeId }, data: { qty: { increment: line.qty } } })
          .catch(() => null)
      )
    );
  }

  return NextResponse.json({ ok: true });
}

function makeTracking(id: string) {
  return "MF-" + id.slice(0, 6).toUpperCase();
}
