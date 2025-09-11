import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Vehiculo } from "@/types/vehiculo";
import ProductMedia from "@/components/ProductMedia";

export const dynamic = "force-dynamic";

type ApiVehiculo = Vehiculo;
type ApiError = { error: string };

async function getVehiculo(id: string): Promise<Vehiculo | null> {
  const h = await headers();
  const host = h.get("host")!;
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
const url = `${proto}://${host}/api/perfumes?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as ApiVehiculo | ApiError;
  if ("error" in data) return null;
  return data;
}

export default async function ProductoPage({ params }: { params: { id: string } }) {
  const v = await getVehiculo(params.id);
  if (!v) notFound();

  const images = Array.isArray(v.imagenes) && v.imagenes.length ? v.imagenes : [v.imagen];

  return (
<main className="pt-28 md:pt-36 pb-28 md:pb-40 bg-neutral-50 min-h-screen">
          <div className="px-6 md:px-10 max-w-7xl mx-auto pt-4 pb-7">
        <nav className="mb-5 text-sm text-neutral-600">
          <Link href="/galeria" className="hover:underline">← Volver a galería</Link>
        </nav>

        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {v.marca} {v.modelo}
          </h1>
          <p className="text-neutral-600 mt-1">
            {v.anio} · {v.transmision} · {v.combustible}
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Galería con carrusel y zoom */}
          <section className="lg:col-span-3">
            <ProductMedia images={images} title={`${v.marca} ${v.modelo}`} />
          </section>

          {/* Caja info con más padding */}
          <aside className="lg:col-span-2">
            <div className="sticky top-28 space-y-6 rounded-2xl border bg-white p-6 md:p-8 shadow-sm">
              <div>
                <div className="text-3xl font-extrabold text-emerald-700">
                  ${v.precio.toLocaleString("es-CL")}
                </div>
                <p className="text-xs text-neutral-500 mt-1">Precio referencial en CLP</p>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-neutral-500">Año</dt>
                  <dd className="font-medium">{v.anio}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Tipo</dt>
                  <dd className="font-medium">{v.tipo}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Transmisión</dt>
                  <dd className="font-medium">{v.transmision}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Combustible</dt>
                  <dd className="font-medium">{v.combustible}</dd>
                </div>
              </dl>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link
                  href={`/contact?vehiculo=${v.id}`}
                  className="flex-1 text-center bg-yellow-400 text-black px-4 py-2 rounded-2xl font-semibold shadow hover:bg-yellow-300"
                >
                  Cotizar
                </Link>
                <Link
                  href="/galeria"
                  className="flex-1 text-center px-4 py-2 rounded-2xl border hover:bg-neutral-50"
                >
                  Ver más vehículos
                </Link>
              </div>
            </div>
          </aside>
        </div>

<section className="mt-12 mb-20 md:mb-28">
              <h2 className="text-lg font-semibold mb-3">Descripción</h2>
          <p className="text-neutral-700 leading-relaxed">
            {v.marca} {v.modelo} {v.anio}. Excelente estado. Listo para cotizar y agendar visita.
          </p>
        </section>
      </div>

      {/* Barra fija móvil */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/90 backdrop-blur p-3 md:hidden">
        <div className="max-w-7xl mx-auto px-3 flex items-center gap-3">
          <div className="font-bold">${v.precio.toLocaleString("es-CL")}</div>
          <Link
            href={`/contact?vehiculo=${v.id}`}
            className="ml-auto bg-yellow-400 text-black px-4 py-2 rounded-2xl font-semibold shadow hover:bg-yellow-300"
          >
            Cotizar
          </Link>
        </div>
      </div>
<div className="h-24 md:hidden" />
    </main>
  );
}
