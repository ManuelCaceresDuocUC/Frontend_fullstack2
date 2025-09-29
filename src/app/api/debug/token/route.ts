export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getToken } from "@/lib/dte";

export async function GET() {
  try {
    const t = await getToken();
    return NextResponse.json({ ok: true, tokenHead: t.slice(0, 16) + "…" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
