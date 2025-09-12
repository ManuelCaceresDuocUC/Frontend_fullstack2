// src/app/pago/webpay/retorno/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commitWebpayTx } from "@/lib/payments/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommitOk = {
  buy_order: string;
  status: string; // "AUTHORIZED" | ...
  vci?: string;
  card_detail?: { card_number?: string } | null;
  [k: string]: unknown;
};

const isPaid = (s: string) => s === "AUTHORIZED" || s === "PAID" || s === "SUCCESS";

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") ?? "";
  let token = "";

  if (ct.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    token = String(fd.get("token_ws") ?? "");
  } else {
    const raw = await req.text();
    try {
      const obj = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      token = String(obj["token_ws"] ?? "");
    } catch {}
  }

  if (!token) return NextResponse.json({ error: "token_ws faltante" }, { status: 400 });

  let commit: CommitOk;
  try {
    commit = (await commitWebpayTx(token)) as CommitOk;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const orderId = String(commit.buy_order ?? "");
  const paid = isPaid(String(commit.status ?? ""));

  await prisma.payment.update({
    where: { orderId },
    data: {
      status: paid ? "PAID" : "FAILED",
      // raw: commit, // <- eliminado porque no existe el campo en tu esquema
    },
  });

  if (paid) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    });
  }

  const base = process.env.APP_BASE_URL ?? "";
  const url = new URL(`${base || ""}/checkout/resultado`, base || "http://localhost:3000");
  url.searchParams.set("orderId", orderId);
  url.searchParams.set("status", paid ? "ok" : "fail");

  return NextResponse.redirect(url.toString(), { status: 303 });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token_ws") ?? "";
  return NextResponse.json({ ok: true, via: "GET", hasToken: Boolean(token) });
}
