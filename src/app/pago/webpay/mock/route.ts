// src/app/pago/webpay/mock/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { url: string }) {
  const u = new URL(ctx.url);
  const ret = u.searchParams.get("return") || "/";
  const fd = await req.formData();
  const token = String(fd.get("token_ws") ?? "");
  return NextResponse.redirect(`${ret}?token_ws=${encodeURIComponent(token)}`);
}
