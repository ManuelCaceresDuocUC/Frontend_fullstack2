import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { orderId } = (await req.json()) as { orderId: string };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, total: true },
  });
  if (!order || order.total <= 0) return NextResponse.json({ error: "Orden inválida" }, { status: 400 });

  const base = process.env.APP_BASE_URL?.replace(/\/+$/, "");
  if (!base) return NextResponse.json({ error: "APP_BASE_URL no definido" }, { status: 500 });
  const returnUrl = `${base}/pago/webpay/retorno`;

  const { url, token } = await webpayTx.create({
    buyOrder: order.id,
    sessionId: order.id,
    amount: order.total,
    returnUrl,
  });

  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: { method: "WEBPAY", status: "INITIATED", amount: order.total, providerTxId: token },
    create: { orderId: order.id, method: "WEBPAY", status: "INITIATED", amount: order.total, providerTxId: token },
  });

  return NextResponse.json({ url, token });
}
