// src/app/api/debug/p12/route.ts
import { NextResponse } from "next/server";
import { loadP12PEM } from "@/lib/cert";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { keyPem, certPem } = loadP12PEM();
    return NextResponse.json({
      keyHead: keyPem.slice(0, 31),         // "-----BEGIN RSA PRIVATE KEY-----"
      certHead: certPem.slice(0, 27),       // "-----BEGIN CERTIFICATE-----"
      rsa: keyPem.startsWith("-----BEGIN RSA PRIVATE KEY-----"),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
