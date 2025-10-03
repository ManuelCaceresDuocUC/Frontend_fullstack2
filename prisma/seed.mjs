// prisma/seed.mjs
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

const DECANTS = [3, 5, 10];
const round10 = (n) => Math.ceil(n / 10) * 10;

function toDbCat(c) {
  // NICHO | ARABES | DISENADOR | OTROS  (sin tilde)
  const u = String(c ?? "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toUpperCase();
  if (u === "NICHO") return "NICHO";
  if (u === "ARABES") return "ARABES";
  if (u === "DISENADOR" || u === "DISEÑADOR" || u === "DISENADOR") return "DISENADOR";
  return "OTROS";
}

async function ensureDecants(perfume) {
  const perMl = perfume.price / Math.max(1, perfume.ml);
  for (const ml of DECANTS) {
    const price = round10(perMl * ml);
    await prisma.perfumeVariant.upsert({
      where: { perfumeId_ml: { perfumeId: perfume.id, ml } }, // @@unique([perfumeId, ml])
      update: {}, // no tocar precio en seed (ajústalo luego en admin si quieres)
      create: { perfumeId: perfume.id, ml, price, stock: 0, active: true },
    });
  }
}

const file = path.join(process.cwd(), "data", "perfumes.json");
const raw = await fs.readFile(file, "utf8").catch(() => "[]");
const rows = JSON.parse(raw);

let createdOrUpdated = 0;

for (const r of rows) {
  const images = Array.isArray(r.imagenes)
    ? r.imagenes
    : (r.imagen ? [r.imagen] : []);

  const data = {
    // si r.id viene lo respetamos; si no, Prisma genera uno
    id: r.id ?? undefined,
    name: String(r.nombre ?? "").trim(),
    brand: String(r.marca ?? "").trim(),
    ml: Number(r.ml ?? 0),
    price: Number(r.precio ?? 0),
    images,                          // JSON[]
    tipo: toDbCat(r.categoria),      // enum PerfumeCategory
    // genero/description quedan opcionales (usa defaults)
  };

  if (!data.name || !data.brand || !Number.isFinite(data.ml) || data.ml <= 0) continue;

  let p;
  if (data.id) {
    const { id, ...rest } = data;
    p = await prisma.perfume.upsert({
      where: { id },
      update: rest,
      create: { id, ...rest },
    });
  } else {
    const existing = await prisma.perfume.findFirst({
      where: { name: data.name, brand: data.brand },
      select: { id: true },
    });
    if (existing) {
      p = await prisma.perfume.update({
        where: { id: existing.id },
        data,
      });
    } else {
      p = await prisma.perfume.create({ data });
    }
  }

  await ensureDecants(p);
  createdOrUpdated++;
}

console.log(`Seed OK: ${createdOrUpdated} perfumes procesados (con variantes 3/5/10 ml).`);
await prisma.$disconnect();
