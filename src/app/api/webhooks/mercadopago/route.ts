// src/app/api/webhooks/mercadopago/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const ev = await req.json(); // MP envía topic/type + data.id
  // Aquí deberías consultar el pago/orden a MP con el Access Token
  // y extraer tu orderId desde external_reference.
  const orderId = ev?.data?.id_external_reference || ev?.external_reference; // ajusta según consulta
  if (!orderId) return NextResponse.json({ ok: true });
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID", payment: { update: { status: "PAID" } } },
  });
  return NextResponse.json({ ok: true });
}
