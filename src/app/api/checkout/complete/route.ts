// app/api/checkout/complete/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CartItem = { id: string; qty: number }; // id = perfumeId
type Address = { street?: string; city?: string; region?: string; zip?: string; notes?: string };

type Body = {
  email: string;
  buyerName: string;
  phone?: string;
  address?: Address;
  items: CartItem[];
};

type PerfumeRow = {
  id: string;
  name: string;
  brand: string;
  ml: number;
  price: number;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    if (!body.items?.length) {
      return NextResponse.json({ error: "items vacíos" }, { status: 400 });
    }

    const ids = body.items.map((i) => i.id);

    const perfumes: PerfumeRow[] = await prisma.perfume.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, brand: true, ml: true, price: true },
    });

    const byId = new Map<string, PerfumeRow>(perfumes.map((p) => [p.id, p]));

    const itemsData = body.items.map((it) => {
      const p = byId.get(it.id);
      if (!p) throw new Error(`Perfume ${it.id} no existe`);
      return {
        perfumeId: p.id,
        name: p.name,
        brand: p.brand,
        ml: p.ml,
        unitPrice: p.price,
        qty: it.qty,
      };
    });

    const subtotal = itemsData.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    const order = await prisma.order.create({
      data: {
        email: body.email,
        buyerName: body.buyerName,
        phone: body.phone ?? "",
        shippingStreet: body.address?.street ?? "",
        shippingCity: body.address?.city ?? "",
        shippingRegion: body.address?.region ?? "",
        shippingZip: body.address?.zip ?? "",
        shippingNotes: body.address?.notes ?? "",
        subtotal,
        shippingFee,
        total,
        status: "PENDING",
        items: { create: itemsData },
        payment: { create: { method: "MANUAL", status: "INITIATED", amount: total } },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: order.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
