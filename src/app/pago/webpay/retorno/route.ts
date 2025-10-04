// src/app/pago/webpay/retorno/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommitResp = {
  buy_order?: string;
  status?: string;
  response_code?: number;
};

const ok = (r: CommitResp) => r.response_code === 0 || r.status === "AUTHORIZED";

function baseUrl(req: NextRequest) {
  const env = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (env) return env;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

async function finalize(token: string) {
  const resp = (await webpayTx.commit(token)) as CommitResp;

  const orderId = String(resp.buy_order ?? "");
  const paid = ok(resp);

  // actualiza Payment y Order (si existen)
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

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const token = String(fd.get("token_ws") ?? "");
  if (!token) return NextResponse.json({ error: "token_ws faltante" }, { status: 400 });

  const { orderId, paid } = await finalize(token);
  return NextResponse.redirect(`${baseUrl(req)}/gracias/${orderId}`, { status: 303 });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token_ws");
  if (!token) return NextResponse.redirect(`${baseUrl(req)}/`, { status: 302 });

  const { orderId, paid } = await finalize(token);
  return NextResponse.redirect(`${baseUrl(req)}/gracias/${orderId}`, { status: 303 });
}
