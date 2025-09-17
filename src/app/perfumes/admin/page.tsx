// src/app/perfumes/admin/page.tsx
import { prisma } from "@/lib/prisma";
import Client, { type Row } from "./Client";
import type { Prisma, Perfume, Stock } from "@prisma/client";

export const dynamic = "force-dynamic";

type Categoria = "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";
const dbToApiCat = (c: string): Categoria =>
  c === "DISENADOR" ? "DISEÑADOR" : (c as Categoria);

// helpers SIN any
function isJsonObject(v: Prisma.JsonValue): v is Prisma.JsonObject {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function getImagesFromJson(v: Prisma.JsonValue | null): string[] {
  if (!v) return [];
  if (Array.isArray(v)) {
    const out: string[] = [];
    for (const it of v) {
      if (typeof it === "string") out.push(it);
      else if (isJsonObject(it) && typeof it.url === "string") out.push(it.url);
    }
    return out;
  }
  return [];
}

type PerfumeWithStock = Perfume & { Stock: Stock | null };

export default async function Page() {
  const data: PerfumeWithStock[] = await prisma.perfume.findMany({
    orderBy: { createdAt: "desc" },
    include: { Stock: true },
  });

  const initialRows: Row[] = data.map((p) => ({
    id: p.id,
    nombre: p.name,
    marca: p.brand,
    ml: p.ml,
    precio: p.price,
    imagenes: getImagesFromJson(p.images),
    categoria: dbToApiCat(String(p.tipo)),
    qty: p.Stock?.qty ?? 0,
    descripcion: p.description ?? "",
  }));

  return <Client initialRows={initialRows} />;
}
