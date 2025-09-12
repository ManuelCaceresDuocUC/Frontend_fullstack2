// src/app/api/payments/webpay/init/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { orderId?: string };
type OrderItem = { unitPrice: number; qty: number } & Partial<{ price: number }>;

export async function POST(req: Request) {
  try {
    const { orderId } = (await req.json()) as Body;
    if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

    // Carga la orden y calcula monto (usa price si existe, si no unitPrice)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

    const amountRaw = order.items.reduce((s, it: OrderItem) => s + (it.price ?? it.unitPrice) * it.qty, 0);
    // Webpay requiere entero en CLP
    const amount = Math.max(1, Math.round(amountRaw));

    // Return URL absoluta (POST de Webpay -> tu /pago/webpay/retorno)
    const h = await headers();
    const host = h.get("host")!;
    const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const returnUrl = `${proto}://${host}/pago/webpay/retorno`;

    // Crea transacción
    const resp = await webpayTx.create(order.id, order.id, amount, returnUrl);

    // Devuelve URL para redirigir al formulario de Webpay
    return NextResponse.json({
      url: `${resp.url}?token_ws=${resp.token}`,
      token: resp.token,
    });
  } catch (err) {
    console.error("WEBPAY INIT ERROR:", err);
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
  }
}
