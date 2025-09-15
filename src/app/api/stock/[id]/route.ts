// src/app/api/stock/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { qty?: number };
type DeltaBody = { delta?: number };

function getId(ctx: unknown): string | undefined {
  if (typeof ctx !== "object" || ctx === null) return;
  const params = (ctx as { params?: unknown }).params;
  if (typeof params !== "object" || params === null) return;
  const id = (params as Record<string, unknown>).id;
  return typeof id === "string" ? id : undefined;
}

export async function PUT(req: Request, ctx: unknown) {
  const id = getId(ctx);
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { qty } = (await req.json()) as Body;
  if (!Number.isFinite(qty)) return NextResponse.json({ error: "qty inválido" }, { status: 400 });

  const r = await prisma.stock.upsert({
    where: { perfumeId: id },
    update: { qty: Number(qty) },
    create: { perfumeId: id, qty: Number(qty) },
  });
  return NextResponse.json({ ok: true, qty: r.qty });
}

export async function PATCH(req: Request, ctx: unknown) {
  const id = getId(ctx);
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { delta } = (await req.json()) as DeltaBody;
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
