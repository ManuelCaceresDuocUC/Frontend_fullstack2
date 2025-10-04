// src/app/pago/webpay/retorno/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayCommit } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webpay retorna por POST con form-urlencoded: token_ws
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const token = String(form.get("token_ws") || "");

    if (!token) {
      // algunos escenarios devuelven TBK_TOKEN o rechazo
      return NextResponse.redirect(new URL("/gracias/error?m=falta_token", process.env.PUBLIC_BASE_URL!).toString());
    }

    const result = await webpayCommit(token);
    // result: { buyOrder, amount, status: "AUTHORIZED"|"FAILED" }

    const payment = await prisma.payment.findFirst({
      where: { providerTxId: token },
      select: { orderId: true },
    });

    const orderId = payment?.orderId ?? result.buyOrder;

    if (result.status === "AUTHORIZED") {
      await prisma.payment.update({
        where: { orderId },
        data: { status: "PAID" },
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });
      return NextResponse.redirect(new URL(`/gracias/${orderId}`, process.env.PUBLIC_BASE_URL!).toString());
    } else {
      await prisma.payment.update({
        where: { orderId },
        data: { status: "FAILED" },
      });
      return NextResponse.redirect(new URL(`/gracias/${orderId}?estado=rechazado`, process.env.PUBLIC_BASE_URL!).toString());
    }
  } catch (e) {
    console.error("retorno webpay error:", e);
    return NextResponse.redirect(new URL("/gracias/error?m=retorno", process.env.PUBLIC_BASE_URL!).toString());
  }
}

// fallback GET (por si lo configuras mal en TBK)
export async function GET() {
  return NextResponse.redirect(new URL("/gracias/error?m=uso_get", process.env.PUBLIC_BASE_URL!).toString());
}
