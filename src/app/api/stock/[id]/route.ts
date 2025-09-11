import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const s = await prisma.stock.findUnique({ where: { perfumeId: params.id } });
  return NextResponse.json({ qty: s?.qty ?? 0 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { qty } = await req.json();
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: "qty inválido" }, { status: 400 });
    }
    const s = await prisma.stock.upsert({
      where: { perfumeId: params.id },
      update: { qty: n },
      create: { perfumeId: params.id, qty: n },
    });
    return NextResponse.json({ qty: s.qty });
  } catch {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  return PUT(req, ctx);
}
