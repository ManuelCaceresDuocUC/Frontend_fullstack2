// app/api/checkout/init/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type InitBody = { perfumeId: string; qty?: number };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as InitBody | null;
    if (!body || typeof body.perfumeId !== "string")
      return NextResponse.json({ error: "perfumeId requerido" }, { status: 400 });

    const qty = Number(body.qty ?? 1);
    if (!Number.isInteger(qty) || qty < 1)
      return NextResponse.json({ error: "qty inválido" }, { status: 400 });

    const p = await prisma.perfume.findUnique({
      where: { id: body.perfumeId },
      select: { id: true, name: true, brand: true, ml: true, price: true },
    });
    if (!p) return NextResponse.json({ error: "perfume no existe" }, { status: 404 });

    const subtotal = p.price * qty;
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    const order = await prisma.order.create({
      data: {
        email: "",
        buyerName: "",
        phone: "",
        shippingStreet: "",
        shippingCity: "",
        shippingRegion: "",
        shippingZip: "",
        shippingNotes: "",
        subtotal,
        shippingFee,
        total,
        status: "PENDING",
        items: {
          create: [
            {
              perfumeId: p.id,
              name: p.name,
              brand: p.brand,
              ml: p.ml,
              unitPrice: p.price,
              qty,
            },
          ],
        },
        payment: { create: { method: "MANUAL", status: "INITIATED", amount: total } },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: order.id });
  } catch (e) {
    // mira este log en la terminal para ver el stack real
    // eslint-disable-next-line no-console
    console.error("checkout/init error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
