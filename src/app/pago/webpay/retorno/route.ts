// src/app/pago/webpay/retorno/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const token = String(form.get("token_ws") || "");

    if (!token) {
      return NextResponse.redirect(new URL("/gracias/error?m=falta_token", process.env.PUBLIC_BASE_URL!).toString());
    }

    const result = await webpayTx.commit(token); // { buyOrder, amount, status }

    // busca por providerTxId; si no, usa buyOrder
    const payment = await prisma.payment.findFirst({
      where: { providerTxId: token },
      select: { orderId: true },
    });
    const orderId = payment?.orderId ?? result.buyOrder;

    if (result.status === "AUTHORIZED") {
      await prisma.payment.update({ where: { orderId }, data: { status: "PAID" } });
      await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
      return NextResponse.redirect(new URL(`/gracias/${orderId}`, process.env.PUBLIC_BASE_URL!).toString());
    }

    await prisma.payment.update({ where: { orderId }, data: { status: "FAILED" } });
    return NextResponse.redirect(new URL(`/gracias/${orderId}?estado=rechazado`, process.env.PUBLIC_BASE_URL!).toString());
  } catch (e) {
    console.error("retorno error:", e);
    return NextResponse.redirect(new URL("/gracias/error?m=retorno", process.env.PUBLIC_BASE_URL!).toString());
  }
}

export async function GET() {
  return NextResponse.redirect(new URL("/gracias/error?m=uso_get", process.env.PUBLIC_BASE_URL!).toString());
}
