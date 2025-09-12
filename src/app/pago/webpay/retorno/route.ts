// src/app/pago/webpay/retorno/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commitWebpayTx } from "@/lib/payments/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Commit = { buy_order?: string; status?: string };
const isPaid = (s?: string) => s === "AUTHORIZED" || s === "PAID" || s === "SUCCESS";

async function finalize(token: string) {
  const data = (await commitWebpayTx(token)) as Commit;
  const orderId = String(data.buy_order ?? "");
  const paid = isPaid(data.status);

  await prisma.payment.update({
    where: { orderId },
    data: { status: paid ? "PAID" : "FAILED" },
  }).catch(() => undefined);

  if (paid) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    }).catch(() => undefined);
  }
  return { orderId, paid };
}

function redirectToResult(orderId: string, paid: boolean) {
  const base = process.env.APP_BASE_URL!;
  return NextResponse.redirect(`${base}/gracias/${orderId}`, { status: 303 });
}

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const token = String(fd.get("token_ws") ?? "");
  if (!token) return NextResponse.json({ error: "token_ws faltante" }, { status: 400 });
  const { orderId, paid } = await finalize(token);
  return redirectToResult(orderId, paid);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token_ws");
  if (!token) return NextResponse.redirect("/", { status: 302 });
  const { orderId, paid } = await finalize(token);
  return redirectToResult(orderId, paid);
}
