// src/scripts/backfill-variant-prices.ts
// Ejecuta: pnpm dlx tsx src/scripts/backfill-variant-prices.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Márgenes por tamaño (puedes sobreescribir por ENV)
const M3  = Number(process.env.M3  ?? 1.55);
const M5  = Number(process.env.M5  ?? 1.45);
const M10 = Number(process.env.M10 ?? 1.35);

function marginForMl(ml: number): number {
  if (ml === 3) return M3;
  if (ml === 5) return M5;
  if (ml === 10) return M10;
  return M5; // default
}
function round990Up(n: number): number {
  if (n <= 0) return 990;
  const k = Math.ceil(n / 1000) * 1000;
  return Math.max(990, k - 10);
}

async function main() {
  // Si tu columna permite null, descomenta el OR con equals: null
  const variants = await prisma.perfumeVariant.findMany({
    where: {
      OR: [
        { price: { lte: 0 } },
        // { price: { equals: null as any } }, // solo si price es nullable en tu schema
      ],
    },
    // Nota: tu modelo NO tiene relación `perfume`, traemos perfume aparte por perfumeId
  });

  let updated = 0, skipped = 0;

  for (const v of variants) {
    const mlVar = Number(v.ml ?? 0);
    if (!mlVar) { skipped++; continue; }

    const p = await prisma.perfume.findUnique({ where: { id: v.perfumeId } });
    if (!p) { skipped++; continue; }

    const bottleMl = Number(p.ml ?? 0);        // tamaño de frasco en Perfume (ml)
    const bottleCLP = Number(p.price ?? 0);    // precio frasco completo en CLP

    if (bottleMl <= 0 || bottleCLP <= 0) { skipped++; continue; }

    const costPerMl = bottleCLP / bottleMl;
    const raw = costPerMl * mlVar * marginForMl(mlVar);
    const price = round990Up(raw);

    await prisma.perfumeVariant.update({
      where: { id: v.id },
      data: { price },
    });

    updated++;
    console.log(`OK ${v.id} · ${mlVar} ml → $${price.toLocaleString("es-CL")} · perfume ${p.id}`);
  }

  console.log(`Listo. Actualizados: ${updated}. Omitidos: ${skipped}.`);
}

main()
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
