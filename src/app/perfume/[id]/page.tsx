// app/perfume/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

const S3_BASE = (process.env.S3_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const resolveImg = (s?: string | null) =>
  !s ? "" : /^https?:\/\//i.test(s) ? s : (S3_BASE ? `${S3_BASE}/${s.replace(/^\/+/, "")}` : s);
const fmt = (n: number) => n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

// redondeo: ajusta a tu política (ceil a múltiplos de 10 para no “regalar”)
const roundCLP = (n: number) => Math.ceil(n / 10) * 10;

export default async function Page({ params }: { params: Promise<{ id: string }>; }) {
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
    ml: perfume.ml,          // frasco total
    precio: perfume.price,   // precio frasco
    descripcion: perfume.description ?? "",
    imagenes: (perfume.images as unknown as string[]) ?? [],
    createdAt: perfume.createdAt.toISOString(),
  };

  // Precios decant derivados
  const perMl = p.precio / Math.max(1, p.ml);
  const sizes = [3, 5, 10].filter((ml) => ml <= p.ml);
  const decants = sizes.map((ml) => ({ ml, price: roundCLP(perMl * ml) }));

  const imgs = p.imagenes.map(resolveImg).filter(Boolean);
  const fallback = S3_BASE
    ? `${S3_BASE}/placeholders/placeholder-4x5.webp`
    : "https://via.placeholder.com/1200x1500?text=Imagen";

  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-10 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <ProductGallery images={imgs} alt={`${p.marca} ${p.nombre}`} fallback={fallback} />

        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6">
          <h1 className="text-3xl font-extrabold">{p.marca} {p.nombre}</h1>
          <p className="mt-1 text-white/80">Frasco: {p.ml} ml • {fmt(p.precio)}</p>

          {/* Lista simple de decants calculados */}
          <div className="mt-4 space-y-3">
            {decants.map(({ ml, price }) => (
              <div key={ml} className="flex items-center justify-between rounded-xl border border-white/20 p-3 bg-white/5">
                <div>
                  <div className="font-semibold">{ml} ml</div>
                  <div className="text-emerald-300 text-lg font-bold">{fmt(price)}</div>
                </div>
                <AddToCartButton
                  id={p.id}
                  name={`${p.nombre} ${ml}ml`}
                  brand={p.marca}
                  price={price}
                  ml={ml}
                  image={imgs[0] ?? fallback}
                  stock={qty}
                  disabled={qty <= 0}
                />
              </div>
            ))}
          </div>

          {p.descripcion && (
            <div className="mt-5 text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
              {p.descripcion}
            </div>
          )}

          <a href="/galeria" className="mt-6 inline-block px-5 py-3 rounded-2xl border border-white/20 hover:bg-white/10">
            Volver
          </a>

          <div className="mt-6 text-sm text-white/70 space-y-1">
            <p><b>ID:</b> {p.id}</p>
            <p><b>Creado:</b> {new Date(p.createdAt).toLocaleString("es-CL")}</p>
          </div>
        </div>
      </div>
    </main>
  );
}