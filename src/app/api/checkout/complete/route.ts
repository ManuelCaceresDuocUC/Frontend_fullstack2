// src/app/pago/webpay/retorno/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayCommit } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mínimo necesario de la respuesta de commit
type CommitResp = {
  buy_order?: string;
  status?: "AUTHORIZED" | "FAILED" | "REVERSED" | string;
  response_code?: number; // 0 = ok en integración
  amount?: number;
};

const isPaid = (r: CommitResp) =>
  r?.response_code === 0 || r?.status === "AUTHORIZED";

const base =
  (process.env.PUBLIC_BASE_URL ?? process.env.APP_BASE_URL ?? "").replace(/\/+$/,"");

async function finalize(token: string) {
  const resp = (await webpayCommit(token)) as CommitResp;
  const orderId = String(resp.buy_order ?? "");
  const paid = isPaid(resp);

  // Actualiza pago/orden (ignora errores si no existen aún)
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

function redirectToResult(orderId: string) {
  // si no hay base, redirige relativo
  const url = base ? `${base}/gracias/${orderId}` : `/gracias/${orderId}`;
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const token = String(fd.get("token_ws") ?? "");
  if (!token) return NextResponse.json({ error: "token_ws faltante" }, { status: 400 });
  const { orderId } = await finalize(token);
  return redirectToResult(orderId);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token_ws");
  if (!token) return NextResponse.redirect("/", { status: 302 });
  const { orderId } = await finalize(token);
  return redirectToResult(orderId);
}
