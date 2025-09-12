// Público: devuelve sólo lo necesario para la página de gracias
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const o = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      total: true,
      status: true,
      items: {
        select: { id: true, brand: true, name: true, ml: true, unitPrice: true, qty: true },
      },
    },
  });
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(o);
}
