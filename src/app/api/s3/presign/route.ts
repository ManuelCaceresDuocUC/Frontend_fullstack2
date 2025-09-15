// src/app/api/s3/presign/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { presignPut, publicUrlFor } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slug = (s?: string) => (s ?? "").toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

function errMsg(e: unknown){ return e instanceof Error ? e.message : String(e); }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    const type = searchParams.get("type") ?? "application/octet-stream";
    const brand = slug(searchParams.get("brand") ?? undefined);
    if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

    const key = `perfumes/${brand || "misc"}/${crypto.randomUUID()}-${filename}`;
    const signedUrl = await presignPut(key, type);
    return NextResponse.json(
      { signedUrl, key, publicUrl: publicUrlFor(key) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 });
  }
}
