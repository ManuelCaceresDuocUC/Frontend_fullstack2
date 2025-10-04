import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;

  const perfume = await prisma.perfume.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!perfume) {
    return NextResponse.json({ error: "No existe" }, { status: 404 });
  }

  return NextResponse.json({
    id: perfume.id,
    name: perfume.name,
    brand: perfume.brand,
    ml: perfume.ml,
    price: perfume.price,
    images: perfume.images,
    description: perfume.description,
    createdAt: perfume.createdAt,
    variants: perfume.variants.map((v) => ({
      id: v.id,
      ml: v.ml,
      price: v.price,
      stock: v.stock,
      active: v.active,
    })),
  });
}
