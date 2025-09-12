// app/pago/webpay/retorno/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpayTx } from "@/lib/webpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const track = (id: string) => "WP-" + id.slice(0, 6).toUpperCase();

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // Si el usuario aborta: Webpay envía TBK_* y NO token_ws
    const abortToken = form.get("TBK_TOKEN");
    const token = (form.get("token_ws") ?? "") as string;

    if (!token || abortToken) {
      const orderId =
        (form.get("TBK_ORDEN_COMPRA") as string) ||
        (form.get("TBK_ID_SESION") as string) ||
        "";

      if (orderId) {
        // Payment a FAILED, pero NO tocamos Order.status (tu enum no tiene "FAILED")
        await prisma.payment.updateMany({
          where: { orderId },
          data: { status: "FAILED" },
        });

        // Devolver stock reservado
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (order) {
          await Promise.all(
            order.items.map((line) =>
              prisma.stock
                .update({
                  where: { perfumeId: line.perfumeId },
                  data: { qty: { increment: line.qty } },
                })
                .catch(() => null)
            )
          );
          // (Opcional) podrías marcar otro estado válido de tu enum, p.ej: "CANCELLED"
          // await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
        }
      }

      return NextResponse.redirect(new URL(`/checkout?ok=0`, req.url));
    }

    // Commit normal
    const result = await webpayTx.commit(token);
    const orderId = result.buy_order;
    const ok = result.status === "AUTHORIZED" && result.response_code === 0;

    await prisma.payment.update({
      where: { orderId },
      data: {
        status: ok ? "PAID" : "FAILED",
        providerTxId: result.authorization_code ?? token,
        amount: Math.round(result.amount ?? 0),
      },
    });

    if (ok) {
      // Order.status solo a "PAID" (valor que sí tienes en el enum)
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      await prisma.shipment.upsert({
        where: { orderId },
        update: {},
        create: { orderId, carrier: "Webpay", tracking: track(orderId) },
      });

      return NextResponse.redirect(new URL(`/checkout?ok=1&order=${orderId}`, req.url));
    }

    // Falló el commit: devolver stock; NO tocar Order.status a "FAILED"
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (order) {
      await Promise.all(
        order.items.map((line) =>
          prisma.stock
            .update({
              where: { perfumeId: line.perfumeId },
              data: { qty: { increment: line.qty } },
            })
            .catch(() => null)
        )
      );
      // (Opcional) usa un estado válido, p.ej. "CANCELLED" o "PENDING", según tu enum.
      // await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    }

    return NextResponse.redirect(new URL(`/checkout?ok=0&order=${orderId}`, req.url));
  } catch (e) {
    console.error("WEBPAY RETORNO error:", e);
    return NextResponse.redirect(new URL(`/checkout?ok=0`, req.url));
  }
}
