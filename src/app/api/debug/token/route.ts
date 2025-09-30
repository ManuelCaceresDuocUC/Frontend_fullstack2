export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getToken } from "@/lib/dte";

export async function GET() {
  try {
    const token = await getToken();
    return Response.json({ ok: true, tokenHead: token.slice(0, 24) });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: String(e?.message || e), stack: String(e?.stack || "").split("\n").slice(0, 6) },
      { status: 500 },
    );
  }
}
