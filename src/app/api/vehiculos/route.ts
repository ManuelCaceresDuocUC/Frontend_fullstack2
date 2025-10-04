import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const S3_BASE = (process.env.S3_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const resolveImg = (s?: string | null) =>
  !s ? "" : /^https?:\/\//i.test(String(s)) ? String(s) : (S3_BASE ? `${S3_BASE}/${String(s).replace(/^\/+/, "")}` : String(s));
const roundCLP = (n: number) => Math.ceil(n / 10) * 10;

type VariantOut = { id: string; ml: number; price: number; stock: number; active: boolean };

export async function GET() {
  const perfumes = await prisma.perfume.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: true },
  });

  const items = perfumes.map((p) => {
    const imgs = Array.isArray(p.images) ? (p.images as unknown as string[]) : [];
    const firstImg = resolveImg(imgs[0] ?? null);

    const v3 = p.variants.find((v) => v.ml === 3 && v.active);
    const v5 = p.variants.find((v) => v.ml === 5 && v.active);
    const v10 = p.variants.find((v) => v.ml === 10 && v.active);

    const perMl = p.price / Math.max(1, p.ml);
    const price3 = v3 ? v3.price : roundCLP(perMl * 3);
    const price5 = v5 ? v5.price : roundCLP(perMl * 5);
    const price10 = v10 ? v10.price : roundCLP(perMl * 10);

    return {
      // shape que usa VehicleCard
      id: p.id,
      marca: p.brand,
      modelo: p.name,
      ml: p.ml,
      // acepta ambos nombres en el front; aquí mandamos ambos para evitar 0
      precio: p.price,
      price: p.price,
      price3,
      price5,
      price10,
      tipo: (p.tipo as unknown as string) ?? "OTROS",
      imagen: firstImg || "https://via.placeholder.com/800x1000?text=Imagen",
    };
  });

  return NextResponse.json({ items });
}
