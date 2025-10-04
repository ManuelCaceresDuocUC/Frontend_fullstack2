// src/app/api/checkout/init/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayCreate } from "@/lib/webpay"; // wrapper abajo

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { orderId, paymentMethod } = await req.json() as { orderId: string; paymentMethod: "WEBPAY" };
    if (paymentMethod !== "WEBPAY") return NextResponse.json({ error: "Método inválido" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId }, select: { id: true, total: true }
    });
    if (!order || order.total <= 0) return NextResponse.json({ error: "Orden inválida" }, { status: 400 });

    // crea o actualiza Payment
    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { status: "INITIATED", amount: order.total, method: "WEBPAY" },
      create: { orderId: order.id, status: "INITIATED", amount: order.total, method: "WEBPAY" },
    });

    const returnUrl = `${process.env.PUBLIC_BASE_URL}/pago/webpay/retorno`;

    // Llama a Webpay (real o mock)
    const { url, token } = await webpayCreate({
      buyOrder: order.id,
      sessionId: order.id,
      amount: order.total,
      returnUrl,
    });

    // Guarda token como providerTxId para rastrear
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { providerTxId: token },
    });

    // Redirección por GET
    return NextResponse.json({ redirectUrl: `${url}?token_ws=${token}` });
  } catch (e) {
    console.error("init error:", e);
    return NextResponse.json({ error: "No se pudo iniciar Webpay" }, { status: 500 });
  }
}
