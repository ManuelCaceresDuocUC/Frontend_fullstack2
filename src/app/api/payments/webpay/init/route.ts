// src/app/api/payments/webpay/init/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { orderId } = (await req.json()) as { orderId?: string };
    if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    // Usa siempre unitPrice (tu tipo no tiene 'price')
    const amount = Math.max(
      1,
      order.items.reduce((s, it) => s + it.unitPrice * it.qty, 0)
    );

    const buyOrder = String(order.id).slice(0, 26);
    const sessionId = String(order.id).slice(0, 61);

    const h = await headers();
    const host = h.get("host")!;
    const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const returnUrl = `${proto}://${host}/pago/webpay/retorno`;

    const resp = await webpayTx.create(buyOrder, sessionId, amount, returnUrl);

    return NextResponse.json({
      url: `${resp.url}?token_ws=${resp.token}`,
      token: resp.token,
    });
  } catch (e: unknown) {
    const err = e as { response?: { data?: unknown; statusText?: string }; message?: string };
    const detail = err.response?.data ?? err.response?.statusText ?? err.message ?? "Unknown error";
    return NextResponse.json({ error: String(detail) }, { status: 500 });
  }
}
