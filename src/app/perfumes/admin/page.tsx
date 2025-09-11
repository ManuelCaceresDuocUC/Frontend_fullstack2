import { prisma } from "@/lib/prisma";
import Client from "./Client";

export const dynamic = "force-dynamic";

type Categoria = "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";
const dbToApiCat = (c: string): Categoria => (c === "DISENADOR" ? "DISEÑADOR" : (c as Categoria));

type PerfumeRowServer = {
  id: string; name: string; brand: string; ml: number; price: number;
  images: unknown; category: string; stock?: { qty: number } | null;
};

export default async function Page() {
  const perfumes = await prisma.perfume.findMany({
    include: { stock: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = (perfumes as PerfumeRowServer[]).map((p: PerfumeRowServer) => ({
    id: p.id,
    nombre: p.name,
    marca: p.brand,
    ml: p.ml,
    precio: p.price,
    imagenes: Array.isArray(p.images) ? (p.images as string[]) : [],
    categoria: dbToApiCat(String(p.category)),
    qty: p.stock?.qty ?? 0,
  }));

  return <Client initialRows={rows} />;
}
