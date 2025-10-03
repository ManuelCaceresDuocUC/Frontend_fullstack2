// src/app/producto/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";
import ProductGallery from "@/components/ProductGallery";

export const dynamic = "force-dynamic";

const S3_BASE = (process.env.S3_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const resolveImg = (s?: string | null) =>
  !s ? "" : /^https?:\/\//i.test(s) ? s : (S3_BASE ? `${S3_BASE}/${s.replace(/^\/+/, "")}` : s);
const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const p = await prisma.perfume.findUnique({
    where: { id },
    include: {
      variants: {
        where: { active: true },
        select: { id: true, ml: true, price: true, stock: true },
        orderBy: { ml: "asc" },
      },
    },
  });
  if (!p) notFound();

  const imgs = Array.isArray(p.images) ? (p.images as unknown as string[]) : [];
  const gallery = imgs.map(resolveImg).filter(Boolean);
  const imageUrl = gallery[0] ?? null;
  const fallback = S3_BASE
    ? `${S3_BASE}/placeholders/placeholder-4x5.webp`
    : "https://via.placeholder.com/1200x1500?text=Imagen";

  return (
    <main className="min-h-[70vh] px-4 py-8">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <ProductGallery images={gallery} alt={`${p.brand} ${p.name}`} fallback={fallback} />

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-3xl font-extrabold">{p.brand} {p.name}</h1>

          <div className="mt-4 space-y-3">
            {p.variants.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div>
                  <div className="font-semibold">{v.ml} ml</div>
                  <div className="text-slate-600">{fmt(v.price)}</div>
                  <div className="text-sm text-slate-600">
                    Stock: {v.stock} {v.stock === 0 && "(sin stock)"}
                  </div>
                </div>
                <AddToCartButton
                  productId={p.id}
                  variantId={v.id}
                  name={p.name}
                  brand={p.brand}
                  ml={v.ml}
                  price={v.price}
                  image={imageUrl}
                  stock={v.stock}
                />
              </div>
            ))}
          </div>

          {p.description && (
            <div className="mt-5 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {p.description}
            </div>
          )}

          <a href="/galeria" className="mt-6 inline-block px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50">
            Volver
          </a>
        </div>
      </div>
    </main>
  );
}
