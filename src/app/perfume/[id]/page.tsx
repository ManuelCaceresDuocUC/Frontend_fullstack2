"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";

const S3_BASE = (process.env.NEXT_PUBLIC_S3_BASE ?? process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
const resolveImg = (s?: string | null) =>
  !s ? "" : /^https?:\/\//i.test(String(s)) ? String(s) : (S3_BASE ? `${S3_BASE}/${String(s).replace(/^\/+/, "")}` : String(s));
const fmt = (n: number) => n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const roundCLP = (n: number) => Math.ceil(n / 10) * 10;

type Variant = { id: string; ml: number; price: number; stock: number; active: boolean };
type Perfume = {
  id: string;
  name: string;
  brand: string;
  ml: number;
  price: number;
  images?: unknown;
  description?: string | null;
  createdAt: string | Date;
  variants?: Variant[];
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [data, setData] = useState<Perfume | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/perfumes/${id}`, { cache: "no-store" });
        if (!r.ok) {
          if (r.status === 404) { router.replace("/galeria"); return; }
          throw new Error(`HTTP ${r.status}`);
        }
        const json = await r.json();
        const perfume: Perfume = json.perfume ?? json.data ?? json;
        if (alive) setData(perfume);
      } catch (e) {
        if (alive) setErr((e as Error).message || "Error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, router]);

  const imgs = useMemo(() => {
    const raw = (data?.images ?? []) as string[] | unknown;
    return Array.isArray(raw) ? (raw as string[]).map(resolveImg).filter(Boolean) : [];
  }, [data]);

  const fallback = S3_BASE
    ? `${S3_BASE}/placeholders/placeholder-4x5.webp`
    : "https://via.placeholder.com/1200x1500?text=Imagen";
  const cover = imgs[0] ?? fallback;

  const options = useMemo(() => {
    if (!data) return [];
    const perMl = data.price / Math.max(1, data.ml);
    const sizes: (3 | 5 | 10)[] = [3, 5, 10];
    return sizes.map((ml) => {
      const v = data.variants?.find((x) => x.ml === ml && x.active);
      const price = v && v.price > 0 ? v.price : roundCLP(perMl * ml);
      const stock = v?.stock ?? 0;
      const variantId = v?.id;
      return { ml, price, stock, variantId };
    });
  }, [data]);

  if (loading) return <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-10 text-white">Cargando…</main>;
  if (err || !data) return <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-10 text-white">No encontrado.</main>;

  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-10 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <ProductGallery images={imgs} alt={`${data.brand} ${data.name}`} fallback={fallback} />

        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6">
          <h1 className="text-3xl font-extrabold">{data.brand} {data.name}</h1>
          <p className="mt-1 text-white/80">Frasco: {data.ml} ml • {fmt(data.price)}</p>

          <div className="mt-4 space-y-3">
            {options.map(({ ml, price, stock, variantId }) => (
              <div key={ml} className="flex items-center justify-between rounded-xl border border-white/20 p-3 bg-white/5">
                <div>
                  <div className="font-semibold">{ml} ml</div>
                  <div className="text-emerald-300 text-lg font-bold">{fmt(price)}</div>
                  <div className={`text-sm ${stock > 0 ? "text-emerald-200" : "text-red-200"}`}>
                    {stock > 0 ? `Stock: ${stock}` : "Sin stock"}
                  </div>
                </div>

                <AddToCartButton
                  productId={data.id}
                  variantId={variantId}
                  name={data.name}
                  brand={data.brand}
                  ml={ml}
                  price={price}
                  stock={stock}
                  image={cover}
                  disabled={stock <= 0}
                />
              </div>
            ))}
          </div>

          {data.description && (
            <div className="mt-5 text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
              {data.description}
            </div>
          )}

          <a href="/galeria" className="mt-6 inline-block px-5 py-3 rounded-2xl border border-white/20 hover:bg-white/10">
            Volver
          </a>

          <div className="mt-6 text-sm text-white/70 space-y-1">
            <p><b>ID:</b> {data.id}</p>
            <p><b>Creado:</b> {new Date(data.createdAt).toLocaleString("es-CL")}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
