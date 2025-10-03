// src/app/perfume/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductGallery from "@/components/ProductGallery";
import VariantSelector from "@/components/VariantSelector";

export const dynamic = "force-dynamic";

const S3_BASE = (process.env.S3_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const resolveImg = (s?: string | null) =>
  !s ? "" : /^https?:\/\//i.test(s) ? s : (S3_BASE ? `${S3_BASE}/${s.replace(/^\/+/, "")}` : s);

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const perfume = await prisma.perfume.findUnique({
    where: { id },
    include: { variants: { where: { active: true }, orderBy: { ml: "asc" } } },
  });
  if (!perfume) notFound();

  const imgs = (perfume.images as unknown as string[] | null)?.map(resolveImg).filter(Boolean) ?? [];
  const fallback = S3_BASE
    ? `${S3_BASE}/placeholders/placeholder-4x5.webp`
    : "https://via.placeholder.com/1200x1500?text=Imagen";

  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-10 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <ProductGallery images={imgs} alt={`${perfume.brand} ${perfume.name}`} fallback={fallback} />

        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6">
          <h1 className="text-3xl font-extrabold">{perfume.brand} {perfume.name}</h1>
          <p className="mt-1 text-white/80">Frasco ref.: {perfume.ml} ml</p>

          <VariantSelector
            perfumeId={perfume.id}
            perfumeName={perfume.name}
            brand={perfume.brand}
            image={imgs[0] ?? fallback}
            variants={perfume.variants.map(v => ({ id: v.id, ml: v.ml, price: v.price, stock: v.stock }))}
          />

          {perfume.description && (
            <div className="mt-6 text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
              {perfume.description}
            </div>
          )}

          <a href="/galeria" className="mt-6 inline-block px-5 py-3 rounded-2xl border border-white/20 hover:bg-white/10">
            Volver
          </a>
        </div>
      </div>
    </main>
  );
}
