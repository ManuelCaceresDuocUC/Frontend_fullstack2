// src/app/api/shipping/quote/route.ts
import { NextResponse } from "next/server";
import { quoteShipping } from "@/lib/shipping";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { region, comuna, subtotal } = await req.json();
  const q = quoteShipping({ region, comuna, subtotal: Number(subtotal||0) });
  if ("error" in q) return NextResponse.json(q, { status: 400 });
  return NextResponse.json(q);
}
