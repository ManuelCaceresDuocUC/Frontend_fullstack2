import { prisma } from "@/lib/prisma";
import Client, { type Row } from "./Client";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Categoria = "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";
const dbToApiCat = (c: string): Categoria =>
  c === "DISENADOR" ? "DISEÑADOR" : (c as Categoria);

// helpers
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

export default async function Page() {
  const data = await prisma.perfume.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        select: { id: true, ml: true, price: true, stock: true, active: true },
        orderBy: { ml: "asc" },
      },
    },
  });

  const initialRows: Row[] = data.map((p) => ({
    id: p.id,
    nombre: p.name,
    marca: p.brand,
    ml: p.ml,
    precio: p.price,
    imagenes: getImagesFromJson(p.images),
    categoria: dbToApiCat(String(p.tipo)),
    descripcion: p.description ?? "",
    // Pasamos las variantes directamente al cliente
    variants: p.variants.map(v => ({
      id: v.id,
      ml: v.ml,
      price: v.price,
      stock: v.stock,
      active: v.active
    })),
  }));

  return <Client initialRows={initialRows} />;
}