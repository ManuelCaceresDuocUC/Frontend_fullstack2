import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = { orderId: string; paymentMethod: "WEBPAY" };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body?.orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
    if (body.paymentMethod !== "WEBPAY") return NextResponse.json({ error: "Método no soportado" }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: body.orderId }, select: { id: true, total: true } });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    if (!order.total || order.total <= 0) return NextResponse.json({ error: "Total inválido" }, { status: 400 });

    // Upsert por orderId único
    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { status: "INITIATED", amount: order.total, method: "WEBPAY" },
      create: { orderId: order.id, method: "WEBPAY", status: "INITIATED", amount: order.total },
      select: { id: true },
    });

    if (!process.env.WEBPAY_ENABLED) {
      return NextResponse.json({ error: "Webpay no habilitado en servidor" }, { status: 503 });
    }

    // TODO: integrar SDK Webpay y construir URL real
    const redirectUrl = "https://webpay.mock/tx?token_ws=" + encodeURIComponent(payment.id);
    return NextResponse.json({ redirectUrl });
  } catch (e) {
    console.error("checkout/init error:", e);
    return NextResponse.json({ error: "Error en init" }, { status: 500 });
  }
}
