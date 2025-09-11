import { NextResponse } from "next/server";
import crypto from "crypto";
import { presignPut } from "@/lib/s3";

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

  const base = (process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/+$/,"");
  const publicUrl = `${base}/${key}`;

  return NextResponse.json({ signedUrl, publicUrl, key });
}
