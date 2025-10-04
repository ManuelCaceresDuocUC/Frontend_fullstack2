import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => null);
    const token = (form?.get("token_ws") || form?.get("TBK_TOKEN")) as string | null;
    if (!token) return NextResponse.json({ error: "Token no recibido" }, { status: 400 });

    // TODO: commit con SDK y validar estado. Placeholder:
    const pay = await prisma.payment.update({
      where: { id: token },
      data: { status: "PAID", providerTxId: token },
      select: { orderId: true },
    });

    await prisma.order.update({ where: { id: pay.orderId }, data: { status: "PAID" } });

    return NextResponse.redirect(new URL(`/gracias/${pay.orderId}`, process.env.PUBLIC_BASE_URL), 303);
  } catch (e) {
    console.error("checkout/complete error:", e);
    return NextResponse.json({ error: "Error al completar pago" }, { status: 500 });
  }
}
