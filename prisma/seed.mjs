// prisma/seed.mjs
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
async function ensureDecants(perfume) {
  const ML = [3, 5, 10]; // ajusta si quieres otros
  const perMl = perfume.price / Math.max(1, perfume.ml);

  for (const ml of ML) {
    const price = Math.ceil((perMl * ml) / 10) * 10;
    await prisma.perfumeVariant.upsert({
      where: { perfumeId_ml: { perfumeId: perfume.id, ml } },
      update: {}, // no toques precio aquí en seed
      create: {
        perfumeId: perfume.id,
        ml,
        price,
        stock: 0,      // stock inicial 0; lo manejas luego en admin
        active: true,
      },
    });
  }
}
const mapCat = (c) => {
  const u = String(c || "").toUpperCase();
  if (["NICHO", "ARABES", "DISEÑADOR", "OTROS"].includes(u)) return u;
  if (u.startsWith("DISEN")) return "DISEÑADOR";
  return "OTROS";
};

const file = path.join(process.cwd(), "data", "perfumes.json");
const raw = await fs.readFile(file, "utf8").catch(() => "[]");
const rows = JSON.parse(raw);

for (const r of rows) {
  const images = Array.isArray(r.imagenes) ? r.imagenes : (r.imagen ? [r.imagen] : []);
  const data = {
    id: r.id ?? undefined,
    name: r.nombre,
    brand: r.marca,
    ml: Number(r.ml),
    price: Number(r.precio),
    images,
    category: mapCat(r.categoria),
  };

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
    });
    if (existing) {
      p = await prisma.perfume.update({
        where: { id: existing.id },
        data: { ...data, id: undefined },
      });
    } else {
      p = await prisma.perfume.create({ data: { ...data, id: undefined } });
    }
  }

  await prisma.stock.upsert({
    where: { perfumeId: p.id },
    update: {},
    create: { perfumeId: p.id, qty: 0 },
  });
}

console.log(`Seeded ${rows.length} perfumes`);
await prisma.$disconnect();
