export const FX = Number(process.env.FX ?? 950);
export const IMPORT = Number(process.env.IMPORT ?? 1.25);
const OZ_TO_ML = 29.5735;

export function round990Up(n: number): number {
  if (n <= 0) return 990;
  const k = Math.ceil(n / 1000) * 1000;
  return Math.max(990, Math.max(n, k - 10)); // nunca menor al bruto
}

export function marginForMl(ml: number): number {
  if (ml === 3)  return Number(process.env.M3  ?? 1);
  if (ml === 5)  return Number(process.env.M5  ?? 1);
  if (ml === 10) return Number(process.env.M10 ?? 1);
  return Number(process.env.M5 ?? 1);
}

export function bottleMlOf(p: { bottleMl?: number|null; bottleOz?: number|null }): number {
  if (p.bottleMl && p.bottleMl > 0) return p.bottleMl;
  if (p.bottleOz && p.bottleOz > 0) return p.bottleOz * OZ_TO_ML;
  throw new Error("Perfume sin tamaño de frasco (ml/oz).");
}

export function computeVariantPrice(params: {
  priceUsd: number; bottleMl: number; ml: number;
  importFactor?: number|null; exchangeRate?: number|null;
}): number {
  const factor = Number(params.importFactor ?? IMPORT);
  const fx = Number(params.exchangeRate ?? FX);
  const costTotal = params.priceUsd * factor * fx;
  const costPerMl = costTotal / params.bottleMl;
  const raw = costPerMl * params.ml * marginForMl(params.ml);
  return round990Up(raw);
}
