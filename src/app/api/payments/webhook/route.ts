// src/app/api/payments/webhook/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
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

    if (typeof p.orderId === "string") orderId = p.orderId;
    else if (p.orderId != null) orderId = String(p.orderId);

    providerRef =
      (typeof p.tx === "string" && p.tx) ||
      (typeof p.token === "string" && p.token) ||
      (typeof p.providerRef === "string" && p.providerRef) ||
      (typeof p.providerTxId === "string" && p.providerTxId) ||
      null;

    const s = typeof p.status === "string" ? p.status.toUpperCase() : "";
    status = s === "PAID" || s === "AUTHORIZED" || s === "INITIATED" ? (s as PaymentState) : "FAILED";
  }

  if (!orderId) throw new Error("orderId missing");
  return { orderId, providerRef, status };
}

async function inferBaseUrl() {
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  return process.env.APP_BASE_URL || (host ? `${proto}://${host}` : "");
}

function makeTracking(prefix: string, id: string) {
  return `${prefix}-${id.slice(0, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as unknown;
    const { orderId, providerRef, status } = normalizeProviderPayload(payload);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, items: true, shipment: true },
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
      // Determina carrier/tracking usando Shipment o región
      const carrierExisting = order.shipment?.carrier ?? null;
      const carrier =
        carrierExisting ?? (order.shippingRegion === "Valparaíso" ? "Despacho propio" : "Bluexpress");

      const trackingExisting = order.shipment?.tracking ?? null;
      const tracking =
        trackingExisting ?? (carrier === "Bluexpress" ? makeTracking("BX", orderId) : makeTracking("DP", orderId));

      // Actualiza estado de la orden
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      // Crea/actualiza Shipment (no escribe columnas inexistentes en Order)
      await prisma.shipment.upsert({
        where: { orderId },
        update: { carrier, tracking },
        create: { orderId, carrier, tracking },
      });

      // Dispara envío de boleta (ignora errores)
      const base = await inferBaseUrl();
      if (base) {
        try { await fetch(`${base}/api/orders/${orderId}/send-invoice`, { method: "POST" }); } catch {}
      }
    } else {
      // Restituye stock con updateMany
      await Promise.all(
  order.items.map((line) =>
    line.variantId
      ? prisma.perfumeVariant.update({
          where: { id: line.variantId },
          data: { stock: { increment: line.qty } },
        })
      : prisma.perfumeVariant.updateMany({
          where: { perfumeId: line.perfumeId, ml: line.ml },
          data: { stock: { increment: line.qty } },
        })
  )
);

      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
