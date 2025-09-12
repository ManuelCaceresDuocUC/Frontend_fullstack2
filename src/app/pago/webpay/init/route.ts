// app/pago/webpay/init/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { orderId } = (await req.json()) as { orderId: string };

    if (!orderId) {
      return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, items: true },
    });
    if (!order) return NextResponse.json({ error: "Orden no existe" }, { status: 404 });
    if (!order.total || order.total <= 0) {
      return NextResponse.json({ error: "Total inválido" }, { status: 400 });
    }

    // Asegura registro de Payment
    await prisma.payment.upsert({
      where: { orderId },
      update: { method: "WEBPAY", status: "INITIATED", amount: order.total },
      create: {
        orderId,
        method: "WEBPAY",
        status: "INITIATED",
        amount: order.total,
      },
    });

    const h = await headers();
    const host = h.get("host")!;
    const proto = h.get("x-forwarded-proto") ?? "https";
    const returnUrl = `${proto}://${host}/pago/webpay/retorno`;

    // En Webpay usamos buy_order = orderId, session_id = orderId (simple y trazable)
    const { token, url } = await webpayTx.create(orderId, orderId, order.total, returnUrl);

    // Devuelve datos para que el cliente haga POST (form) a `url` con `token_ws`
    return NextResponse.json({ url, token, token_ws: token });
  } catch (e) {
    console.error("WEBPAY INIT error:", e);
    return NextResponse.json({ error: "Error iniciando Webpay" }, { status: 500 });
  }
}
