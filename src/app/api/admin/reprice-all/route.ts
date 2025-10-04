import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { computeVariantPrice, marginForMl, round990Up } from "@/lib/pricing";
import type { Prisma, Perfume, PerfumeVariant } from "@prisma/client";

type PerfumeUSDProps = {
  bottleMl?: number | null;
  bottleOz?: number | null;
  priceUsd?: number | null;
  labelleUsd?: number | null;
  importFactor?: number | null;
  exchangeRate?: number | null;
};
const OZ_TO_ML = 29.5735;

type PerfumeWithVariants = (Perfume & Partial<PerfumeUSDProps>) & {
  variants: Pick<PerfumeVariant, "id" | "ml">[];
};

function bottleMlFrom(p: Perfume & Partial<PerfumeUSDProps>): number {
  if (p.bottleMl && p.bottleMl > 0) return p.bottleMl;
  if (p.bottleOz && p.bottleOz > 0) return p.bottleOz * OZ_TO_ML;
  return p.ml;
}

export async function POST() {
  const perfumes = (await db.perfume.findMany({
    include: { variants: { select: { id: true, ml: true } } },
  })) as PerfumeWithVariants[];

  const ops: Prisma.PrismaPromise<unknown>[] = [];

  for (const p of perfumes) {
    const mlBottle = bottleMlFrom(p);
    const priceUsd = Number(p.priceUsd ?? p.labelleUsd ?? 0);
    const useUSD = priceUsd > 0 && mlBottle > 0;

    for (const v of p.variants) {
      const ml = Number(v.ml);
      if (!ml) continue;

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

      if (price != null) {
        ops.push(
          db.perfumeVariant.update({
            where: { id: v.id },
            data: { price },
          })
        );
      }
    }
  }

  if (ops.length === 0) return NextResponse.json({ ok: true, updated: 0 });

  const results = await db.$transaction(ops);
  return NextResponse.json({ ok: true, updated: results.length });
}
