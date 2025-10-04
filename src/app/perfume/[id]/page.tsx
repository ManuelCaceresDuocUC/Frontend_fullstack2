import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Next 15: no tipear el 2º arg; parsea a mano
function getParams(ctx: unknown): { id: string } {
  if (typeof ctx === "object" && ctx && "params" in (ctx as any)) {
    const p = (ctx as any).params;
    if (p && typeof p.id === "string") return { id: p.id };
  }
  throw new Error("Route context inválido");
}

// GET /api/perfumes/:id  -> { ok, perfume }
export async function GET(_req: Request, ctx: unknown) {
  const { id } = getParams(ctx);

  const perfume = await prisma.perfume.findUnique({
    where: { id },
    include: {
      variants: {
        where: { ml: { in: [3, 5, 10] } },
        select: { id: true, ml: true, price: true, stock: true, active: true },
        orderBy: { ml: "asc" },
      },
    },
  });

  if (!perfume) {
    return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, perfume });
}

// Opcional: evita 405 en preflight raros
export async function HEAD(_req: Request, _ctx: unknown) {
  return new NextResponse(null, { status: 200 });
}
