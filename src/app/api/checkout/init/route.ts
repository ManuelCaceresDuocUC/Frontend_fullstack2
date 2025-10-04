// src/app/api/checkout/init/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { webpayCreate } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { orderId?: string };

export async function POST(req: Request) {
  try {
    const { orderId } = (await req.json()) as Body;
    if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // Asegura Payment en estado INITIATED + método WEBPAY
    await prisma.payment.upsert({
      where: { orderId },
      create: { orderId, method: "WEBPAY", status: "INITIATED", amount: order.total },
      update: { method: "WEBPAY", status: "INITIATED", amount: order.total },
    });

    // returnUrl absoluto
    const h = await headers();
    const host = h.get("host")!;
    const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const base = (process.env.APP_BASE_URL?.replace(/\/+$/, "") || `${proto}://${host}`);
    const returnUrl = `${base}/pago/webpay/retorno`;

    const resp = await webpayCreate(order.id, order.id, Math.max(1, Math.round(order.total)), returnUrl);

    return NextResponse.json({ redirectUrl: `${resp.url}?token_ws=${resp.token}`, token: resp.token });
  } catch (err) {
    console.error("WEBPAY INIT ERROR:", err);
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
  }
}
