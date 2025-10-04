// src/app/api/admin/reprice/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { computeVariantPrice, marginForMl, round990Up } from "@/lib/pricing";
import type { Perfume, PerfumeVariant } from "@prisma/client";

type PerfumeUSDProps = {
  bottleMl?: number | null;
  bottleOz?: number | null;
  priceUsd?: number | null;
  labelleUsd?: number | null;
  importFactor?: number | null;
  exchangeRate?: number | null;
};

const OZ_TO_ML = 29.5735;

function bottleMlFrom(p: Perfume & Partial<PerfumeUSDProps>): number {
  if (p.bottleMl && p.bottleMl > 0) return p.bottleMl;
  if (p.bottleOz && p.bottleOz > 0) return p.bottleOz * OZ_TO_ML;
  return p.ml;
}

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;

  const perfume = await db.perfume.findUnique({
    where: { id },
    include: { variants: { select: { id: true, ml: true } } },
  });

  if (!perfume) {
    return NextResponse.json({ error: "Perfume no encontrado" }, { status: 404 });
  }

  const p = perfume as Perfume & Partial<PerfumeUSDProps>;
  const mlBottle = bottleMlFrom(p);
  const priceUsd = Number(p.priceUsd ?? p.labelleUsd ?? 0);
  const useUSD = priceUsd > 0 && mlBottle > 0;

  const updates = perfume.variants
    .map((v: Pick<PerfumeVariant, "id" | "ml">) => {
      const ml = Number(v.ml);
      if (!ml) return null;

      let price: number | null = null;

      if (useUSD) {
        price = computeVariantPrice({
          priceUsd,
          bottleMl: mlBottle,
          ml,
          importFactor: p.importFactor ?? null,
          exchangeRate: p.exchangeRate ?? null,
        });
      } else if (p.price > 0 && p.ml > 0) {
        const costPerMl = p.price / p.ml;
        price = round990Up(costPerMl * ml * marginForMl(ml));
      }

      if (price == null) return null;
      return db.perfumeVariant.update({ where: { id: v.id }, data: { price } });
    })
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  if (updates.length === 0) return NextResponse.json({ ok: true, updated: 0 });

  const res = await db.$transaction(updates);
  return NextResponse.json({ ok: true, updated: res.length });
}
