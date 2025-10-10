import { NextResponse } from "next/server";
import { mailer } from "@/lib/sendEmail";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tr = mailer();
    await tr.verify();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
