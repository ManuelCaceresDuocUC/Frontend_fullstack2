// src/app/pago/webpay/retorno/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readToken(req: Request): Promise<string | null> {
  if (req.method === "POST") {
    const fd = await req.formData();
    return (fd.get("token_ws") as string) ?? null;
  }
  const u = new URL(req.url);
  return u.searchParams.get("token_ws");
}

export async function GET(req: Request) {
  const token = await readToken(req);
  if (!token) return NextResponse.json({ error: "token_ws faltante" }, { status: 400 });

  const r = await webpayTx.commit(token);
  // en mock, buyOrder = token sin prefijo; ajusta si cambiaste lógica
  const orderId = r.buyOrder;

  // marca pago y orden
  await prisma.payment.updateMany({
    where: { orderId },
    data: { status: r.status === "AUTHORIZED" ? "AUTHORIZED" : "FAILED" },
  });
  if (r.status === "AUTHORIZED") {
    await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
  }

  return NextResponse.redirect(`/gracias/${orderId}`);
}

export async function POST(req: Request) {
  return GET(req); // Transbank real llega por POST; mock por GET
}
