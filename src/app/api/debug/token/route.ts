export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getToken } from "@/lib/dte";

export async function GET() {
  try {
    const token = await getToken();
    return Response.json({ ok: true, tokenHead: token.slice(0, 24) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const st = e instanceof Error ? String(e.stack || "").split("\n").slice(0, 6) : [];
    return Response.json({ ok: false, error: msg, stack: st }, { status: 500 });
  }
}
