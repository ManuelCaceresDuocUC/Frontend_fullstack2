// app/perfume/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

const S3_BASE = (process.env.S3_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const resolveImg = (s?: string | null) =>
  !s ? "" : /^https?:\/\//i.test(s) ? s : (S3_BASE ? `${S3_BASE}/${s.replace(/^\/+/, "")}` : s);
const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const perfume = await prisma.perfume.findUnique({
    where: { id },
    include: { Stock: true },
  });
  if (!perfume) notFound();

  const qty = Number(perfume.Stock?.qty ?? 0);

  const p = {
    id: perfume.id,
    nombre: perfume.name,
    marca: perfume.brand,
    ml: perfume.ml,
    precio: perfume.price,
    descripcion: perfume.description ?? "",   // ← NUEVO
    imagenes: (perfume.images as unknown as string[]) ?? [],
    createdAt: perfume.createdAt.toISOString(),
  };

  const imgs = p.imagenes.map(resolveImg).filter(Boolean);
  const fallback = S3_BASE
    ? `${S3_BASE}/placeholders/placeholder-4x5.webp`
    : "https://via.placeholder.com/1200x1500?text=Imagen";

  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-10 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <ProductGallery images={imgs} alt={`${p.marca} ${p.nombre}`} fallback={fallback} />

        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6">
          <h1 className="text-3xl font-extrabold">
            {p.marca} {p.nombre}
          </h1>
          <p className="mt-1 text-white/80">Contenido: {p.ml} ml</p>
          <p className="mt-2 text-emerald-300 text-2xl font-black">{fmt(p.precio)}</p>
          <p className={qty > 0 ? "mt-1 text-emerald-400" : "mt-1 text-red-300"}>
            {qty > 0 ? `Stock: ${qty} unidades` : "Sin stock"}
          </p>
          {p.descripcion && (
            <div className="mt-5 text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
              {p.descripcion}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <AddToCartButton
              id={perfume.id}
              name={perfume.name}
              brand={perfume.brand}
              price={perfume.price}
              ml={perfume.ml}
              image={imgs[0] ?? fallback}
              stock={qty}            // ← pásalo
              disabled={qty <= 0}
            />
            <a href="/galeria" className="px-5 py-3 rounded-2xl border border-white/20 hover:bg-white/10">
              Volver
            </a>
          </div>

          <div className="mt-6 text-sm text-white/70 space-y-1">
            <p><b>ID:</b> {p.id}</p>
            <p><b>Creado:</b> {new Date(p.createdAt).toLocaleString("es-CL")}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
