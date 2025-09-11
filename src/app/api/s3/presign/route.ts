// src/app/api/s3/presign/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { presignPut } from "@/lib/s3";

export const runtime = "nodejs";

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");
  const type = searchParams.get("type") ?? "application/octet-stream";
  const brand = slug(searchParams.get("brand") ?? "misc");
  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

  const key = `perfumes/${brand}/${crypto.randomUUID()}-${filename}`;
  const signedUrl = await presignPut(key, type);

  const base =
    process.env.NEXT_PUBLIC_S3_BASE ??
    `https://${process.env.S3_BUCKET!}.s3.${process.env.AWS_REGION!}.amazonaws.com`;

  return NextResponse.json({ signedUrl, publicUrl: `${base}/${key}`, key });
}
