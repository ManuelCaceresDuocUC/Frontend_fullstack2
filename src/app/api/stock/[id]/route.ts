import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = new URL(req.url).pathname.split("/").pop()!;
  const stock = await prisma.stock.findUnique({
    where: { id },
    select: { id: true, perfumeId: true, qty: true },
  });
  if (!stock) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(stock);
}
