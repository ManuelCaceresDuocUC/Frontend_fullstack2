import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { qty: number };

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { qty } = (await req.json()) as Partial<Body>;
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  if (!Number.isFinite(qty)) return NextResponse.json({ error: "qty inválido" }, { status: 400 });

  const r = await prisma.stock.upsert({
    where: { perfumeId: id },
    update: { qty: Number(qty) },
    create: { perfumeId: id, qty: Number(qty) },
  });
  return NextResponse.json({ ok: true, qty: r.qty });
}

// opcional: ajustar por delta
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const { delta } = (await req.json()) as { delta: number };
  if (!Number.isFinite(delta)) return NextResponse.json({ error: "delta inválido" }, { status: 400 });

  const cur = await prisma.stock.upsert({
    where: { perfumeId: id },
    update: {},
    create: { perfumeId: id, qty: 0 },
  });
  const next = Math.max(0, (cur.qty ?? 0) + Number(delta));
  const r = await prisma.stock.update({ where: { perfumeId: id }, data: { qty: next } });
  return NextResponse.json({ ok: true, qty: r.qty });
}
