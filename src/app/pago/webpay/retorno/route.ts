// src/app/pago/webpay/retorno/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommitResp = { buy_order?: string; status?: string; response_code?: number };
const isOk = (r: CommitResp) => r.response_code === 0 || r.status === "AUTHORIZED";

function baseUrl(req: NextRequest) {
  const env = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (env) return env!;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

/** Descuenta stock agrupando por variantId (clamp a 0) */
async function discountStock(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId, variantId: { not: null } },
    select: { variantId: true, qty: true },
  });

  if (items.length === 0) return;

  // agrupar qty por variante
  const need = new Map<string, number>();
  for (const it of items) {
    const id = it.variantId as string;
    need.set(id, (need.get(id) || 0) + it.qty);
  }

  const ids = [...need.keys()];
  const variants = await tx.perfumeVariant.findMany({
    where: { id: { in: ids } },
    select: { id: true, stock: true },
  });

  for (const v of variants) {
    const dec = need.get(v.id)!;
    const newStock = Math.max(0, v.stock - dec);
    if (newStock !== v.stock) {
      await tx.perfumeVariant.update({
        where: { id: v.id },
        data: { stock: newStock },
      });
    }
  }
}

async function finalize(token: string) {
  const resp = (await webpayTx.commit(token)) as CommitResp;
  const orderId = String(resp.buy_order ?? "");
  const paid = isOk(resp);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId },
      data: { status: paid ? "PAID" : "FAILED" },
    }).catch(() => undefined);

    if (paid) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      }).catch(() => undefined);

      await discountStock(tx, orderId);
    }
  });

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
