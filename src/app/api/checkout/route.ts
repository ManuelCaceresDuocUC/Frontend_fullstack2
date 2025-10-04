import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ItemIn =
  | { id: string; qty: number }                 // perfume base
  | { variantId: string; qty: number };         // variante

type Body = {
  email: string;
  buyerName: string;
  phone?: string;
  address: { street: string; city: string; region: string; zip?: string; notes?: string };
  shipping?: { fee?: number };                  // provider no existe en Order (usa Shipment luego)
  items: ItemIn[];
  paymentMethod: "WEBPAY";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!Array.isArray(body.items) || body.items.length === 0)
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });

    let subtotal = 0;
    const lines: {
      perfumeId: string;
      variantId?: string;
      name: string;
      brand: string;
      ml: number;
      unitPrice: number;
      qty: number;
    }[] = [];

    for (const it of body.items) {
      const qty = Number(it.qty);
      if (!Number.isInteger(qty) || qty < 1) return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });

      if ("variantId" in it && it.variantId) {
        const v = await prisma.perfumeVariant.findUnique({
          where: { id: it.variantId },
          select: { id: true, ml: true, price: true, perfume: { select: { id: true, name: true, brand: true } } },
        });
        if (!v) return NextResponse.json({ error: "Variante no encontrada" }, { status: 400 });
        if (!v.price || v.price <= 0) return NextResponse.json({ error: "Precio de variante inválido" }, { status: 400 });

        lines.push({
          perfumeId: v.perfume.id,
          variantId: v.id,
          name: v.perfume.name,
          brand: v.perfume.brand,
          ml: v.ml,
          unitPrice: v.price,
          qty,
        });
        subtotal += v.price * qty;
      } else if ("id" in it && it.id) {
        const p = await prisma.perfume.findUnique({
          where: { id: it.id },
          select: { id: true, name: true, brand: true, ml: true, price: true },
        });
        if (!p) return NextResponse.json({ error: "Producto no encontrado" }, { status: 400 });
        if (!p.price || p.price <= 0) return NextResponse.json({ error: "Precio de producto inválido" }, { status: 400 });

        lines.push({
          perfumeId: p.id,
          name: p.name,
          brand: p.brand,
          ml: p.ml,
          unitPrice: p.price,
          qty,
        });
        subtotal += p.price * qty;
      } else {
        return NextResponse.json({ error: "Item sin identificador" }, { status: 400 });
      }
    }

    const shippingFee = Math.max(0, Number(body?.shipping?.fee ?? 0));
    const total = subtotal + shippingFee;
    if (total <= 0) return NextResponse.json({ error: "Total $0 inválido" }, { status: 400 });

    const order = await prisma.order.create({
      data: {
        email: body.email,
        buyerName: body.buyerName,
        phone: body.phone || undefined,
        shippingStreet: body.address.street,
        shippingCity: body.address.city,
        shippingRegion: body.address.region,
        shippingZip: body.address.zip || undefined,     // evita null
        shippingNotes: body.address.notes || undefined, // evita null
        subtotal,
        shippingFee,
        total,
        items: {
          create: lines.map(l => ({
            perfume: { connect: { id: l.perfumeId } },
            ...(l.variantId ? { variant: { connect: { id: l.variantId } } } : {}),
            name: l.name,
            brand: l.brand,
            ml: l.ml,
            unitPrice: l.unitPrice,
            qty: l.qty,
          })),
        },
      },
      select: { id: true, total: true },
    });

    return NextResponse.json(order);
  } catch (e) {
    console.error("checkout error:", e);
    return NextResponse.json({ error: "Error en checkout" }, { status: 500 });
  }
}
