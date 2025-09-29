// src/app/api/debug/token/route.ts
import { NextResponse } from "next/server";
import { getToken } from "@/lib/dte";
import pkg from "xml-crypto/package.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// opción A: helper seguro para leer el global
function getArity(): number | undefined {
  const g = globalThis as unknown as { __arity?: unknown };
  return typeof g.__arity === "number" ? g.__arity : undefined;
}

export async function GET() {
  const { version } = pkg as { version: string };
  const arity = getArity();
  console.log("xml-crypto version:", version);
  console.log("xml-crypto addReference arity:", arity);

  try {
    const token = await getToken();
    return NextResponse.json({
      ok: true,
      tokenHead: token.slice(0, 16),
      version,
      arity,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: String(e), version, arity },
      { status: 500 },
    );
  }
}
