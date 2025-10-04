// src/app/api/perfumes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const S3_BASE = (process.env.S3_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const resolveImg = (s?: string | null) =>
  !s ? "" : /^https?:\/\//i.test(String(s)) ? String(s) : (S3_BASE ? `${S3_BASE}/${String(s).replace(/^\/+/, "")}` : String(s));
const roundCLP = (n: number) => Math.ceil(n / 10) * 10;

export async function GET() {
  const perfumes = await prisma.perfume.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: true },
  });

  const sizes = [3, 5, 10] as const; // <- clave para el tipado

  const data = perfumes.map((p) => {
    const imgs: string[] = Array.isArray(p.images) ? (p.images as unknown as string[]) : [];
    const perMl = p.price / Math.max(1, p.ml);

    const getPrice = (ml: (typeof sizes)[number]) => {
      const v = p.variants.find((x) => x.ml === ml && x.active);
      return v ? v.price : roundCLP(perMl * ml);
    };

    const candidates = sizes
      .map((ml) => getPrice(ml)) // ahora el tipo encaja
      .filter((n) => Number.isFinite(n) && n > 0);

    const desde = candidates.length ? Math.min(...candidates) : roundCLP(perMl * 3);

    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      ml: p.ml,
      price: p.price,
      desde,
      image: resolveImg(imgs[0] ?? null),
    };
  });

  return NextResponse.json({ data });
}
