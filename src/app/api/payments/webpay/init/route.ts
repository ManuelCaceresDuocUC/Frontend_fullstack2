import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { orderId: inOrderId } = (await req.json()) as { orderId?: string };

  if (!inOrderId) {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  }

  // Carga la orden y calcula monto
  const order = await prisma.order.findUnique({
    where: { id: inOrderId },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const amount = Math.max(
  1,
  order.items.reduce((s, it: { unitPrice: number; qty: number } & Partial<{ price: number }>) =>
    s + (it.price ?? it.unitPrice) * it.qty, 0)
);

  // Arma return URL absoluta
  const h = await headers();
  const host = h.get("host")!;
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const returnUrl = `${proto}://${host}/pago/webpay/retorno`;

  // Crea transacción
  const resp = await webpayTx.create(order.id, order.id, amount, returnUrl);

  // Devuelve URL para redirigir
  return NextResponse.json({
    url: `${resp.url}?token_ws=${resp.token}`,
    token: resp.token,
  });
}
