// src/app/api/sii/seed/route.ts
import { NextResponse } from "next/server";
import { ensureMtlsDispatcher } from "@/lib/cert";

const BASE = "https://palena.sii.cl";
const soapEnv = (inner: string) =>
  `<?xml version="1.0" encoding="ISO-8859-1"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>${inner}</soapenv:Body></soapenv:Envelope>`;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    ensureMtlsDispatcher();

    const env = soapEnv(`<getSeed/>`);
    const r = await fetch(`${BASE}/DTEWS/CrSeed.jws`, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=ISO-8859-1",
        "Accept": "text/xml,application/xml,text/plain",
        "SOAPAction": "",
      },
      body: env,
    });
    const text = await r.text();
    return NextResponse.json({ status: r.status, bodyHead: text.slice(0, 1000) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
