// src/app/api/debug/p12/route.ts
import { NextResponse } from "next/server";
 import { loadP12Pem } from "@/lib/cert";
import { createPrivateKey } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { keyPem, certPem } = loadP12Pem();
    const k = createPrivateKey({ key: keyPem.replace(/\r/g, "") });

    return NextResponse.json({
      keyHead: keyPem.slice(0, 31),   // "-----BEGIN ...PRIVATE KEY-----"
      keyType: k.type,                // "private"
      algo: k.asymmetricKeyType,      // "rsa" esperado
      certHead: certPem.slice(0, 27), // "-----BEGIN CERTIFICATE-----"
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
