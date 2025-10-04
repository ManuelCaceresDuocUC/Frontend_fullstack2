"use client";
import Image from "next/image";
import Link from "next/link";

export type Vehiculo = {
  id: string;
  marca: string;
  modelo: string;
  anio?: number;
  stock3?: number;
  stock5?: number;
  stock10?: number;
  // aceptar ambos nombres
  precio?: number | string;
  price?: number | string;
  price3?: number | string;
  price5?: number | string;
  price10?: number | string;
  tipo?: "suv"|"sedan"|"hatchback"|"pickup"|"4x4"|"motocicleta"|"NICHO"|"ARABES"|"DISENADOR"|"OTROS";
  combustible?: "gasolina" | "diesel" | "hibrido" | "electrico";
  transmision?: "manual" | "automatica" | "cvt";
  imagen: string;
};

const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

const toNum = (x: unknown): number | null => {
  if (x == null) return null;
  if (typeof x === "number") return Number.isFinite(x) && x > 0 ? x : null;
  if (typeof x === "string") {
    const n = Number(x.replace(/\s+/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
};

export default function VehicleCard({ v, compact = false }: { v?: Vehiculo; compact?: boolean }) {
  if (!v) return null;

const isPerfume = v.anio == null || v.anio === 0;

  const base = toNum(v.precio ?? v.price);               // <- clave
  const d3 = toNum(v.price3);
  const d5 = toNum(v.price5);
  const d10 = toNum(v.price10);

  const decants = [d3, d5, d10].filter((n): n is number => n != null);
  const hasDecants = decants.length > 0;
  const desde = hasDecants ? Math.min(...decants) : null;

  const priceToShow = (hasDecants ? desde : base) ?? null;
  const showDesdeBadge = isPerfume && hasDecants && desde != null && (base == null || desde < base);

  const wrapperCls = isPerfume
    ? `relative w-full aspect-[3/4] bg-white ${compact ? "p-2" : "p-4"}`
    : `relative w-full ${compact ? "aspect-[4/3]" : "aspect-video"}`;

  const imageCls = isPerfume ? "object-contain object-center" : "object-cover";

  return (
    <div className={`group rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-sm overflow-hidden transition hover:shadow-md ${compact ? "text-sm" : ""}`}>
      <div className={wrapperCls}>
        <Image
          src={v.imagen}
          alt={`${v.marca} ${v.modelo}`}
          fill
          className={imageCls}
          sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        />
        {!isPerfume && <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />}
      </div>

      <div className={`flex-1 flex flex-col gap-2 ${compact ? "p-3" : "p-5"}`}>
        <h3 className={compact ? "text-base font-semibold leading-tight" : "text-lg font-semibold leading-tight"}>
          {v.marca} {v.modelo}{!isPerfume && v.anio != null && <span className="text-neutral-500 font-normal"> {v.anio}</span>}
        </h3>

        <p className={compact ? "text-emerald-700 font-bold" : "text-emerald-700 font-extrabold"}>
          {showDesdeBadge && <span className="mr-1 text-neutral-500 text-xs">desde</span>}
          {priceToShow != null ? fmt(priceToShow) : "Consultar"}
        </p>

        <div className={`mt-1 flex flex-wrap gap-2 ${compact ? "text-[11px]" : "text-xs"}`}>
          {isPerfume ? (
            (() => {
              const s3  = Number(v.stock3 ?? 0);
              const s5  = Number(v.stock5 ?? 0);
              const s10 = Number(v.stock10 ?? 0);
              const sizes = [
                ...(s3  > 0 ? [3]  : []),
                ...(s5  > 0 ? [5]  : []),
                ...(s10 > 0 ? [10] : []),
              ];

              // Si NO hay info de variantes (todo undefined), no mostramos el frasco total.
              const hasVariantInfo = v.stock3 != null || v.stock5 != null || v.stock10 != null;

              if (!hasVariantInfo) return null;                 // nada
              if (sizes.length === 0)
                return <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">Sin stock</span>;

              return (
                <>
                  {sizes.map(ml => (
                    <span key={ml} className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                      {ml} ml
                    </span>
                  ))}
                </>
              );
            })()
          ) : (
            <>
              {v.tipo && <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">{v.tipo.toUpperCase()}</span>}
              {v.combustible && <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">{v.combustible}</span>}
              {v.transmision && <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">{v.transmision}</span>}
            </>
          )}
        </div>

        <Link
          href={isPerfume ? `/perfume/${v.id}` : `/producto/${v.id}`}
          className={`mt-3 inline-block bg-yellow-400 text-black ${compact ? "px-3 py-2 text-sm" : "px-4 py-2"} rounded-2xl font-semibold shadow hover:bg-yellow-300 text-center`}
        >
          {isPerfume ? "Ver perfume" : "Cotizar"}
        </Link>
      </div>
    </div>
  );
}
