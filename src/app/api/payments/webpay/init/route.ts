// src/app/api/payments/webpay/init/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { orderId } = (await req.json()) as { orderId: string };
    if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, total: true },
    });
    if (!order || order.total <= 0) {
      return NextResponse.json({ error: "Orden inválida" }, { status: 400 });
    }

    const h = await headers();
    const host = h.get("host")!;
    const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const base = (process.env.PUBLIC_BASE_URL ?? `${proto}://${host}`).replace(/\/+$/, "");
    const returnUrl = `${base}/pago/webpay/retorno`;

    // 👇 SDK: (buyOrder, sessionId, amount, returnUrl)
    const { token, url } = await webpayTx.create(order.id, order.id, order.total, returnUrl);

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { method: "WEBPAY", status: "INITIATED", amount: order.total, providerTxId: token },
      create: { orderId: order.id, method: "WEBPAY", status: "INITIATED", amount: order.total, providerTxId: token },
    });

    return NextResponse.json({ redirectUrl: `${url}?token_ws=${token}` });
  } catch (e) {
    console.error("webpay init error:", e);
    return NextResponse.json({ error: "No se pudo iniciar Webpay" }, { status: 500 });
  }
}
