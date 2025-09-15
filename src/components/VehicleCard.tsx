// components/VehicleCard.tsx
"use client";
import Image from "next/image";
import Link from "next/link";

export type Vehiculo = {
  id: string;
  marca: string;
  modelo: string;
  anio?: number;
  ml?: number;
  precio: number;
  tipo?: "suv"|"sedan"|"hatchback"|"pickup"|"4x4"|"motocicleta"|"NICHO"|"ARABES"|"DISEÑADOR"|"OTROS";
  combustible?: "gasolina" | "diesel" | "hibrido" | "electrico";
  transmision?: "manual" | "automatica" | "cvt";
  imagen: string;
};

const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default function VehicleCard({ v }: { v?: Vehiculo }) {
  if (!v) return null;
  const isPerfume = v.ml != null || v.anio == null || v.anio === 0;

  const wrapperCls = isPerfume
    ? "relative w-full aspect-[3/4] bg-white p-4"   // botella completa
    : "relative w-full aspect-video";               // autos 16:9

  const imageCls = isPerfume
    ? "object-contain object-center"                // no recorta
    : "object-cover";                               // auto a pantalla

  return (
    <div className="group rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-sm overflow-hidden transition hover:shadow-md">
      <div className={wrapperCls}>
        <Image
          src={v.imagen}
          alt={`${v.marca} ${v.modelo}${isPerfume && v.ml ? ` ${v.ml} ml` : v.anio ? ` ${v.anio}` : ""}`}
          fill
          className={imageCls}
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        />
        {!isPerfume && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-2">
        <h3 className="text-lg font-semibold leading-tight">
          {v.marca} {v.modelo}
          {!isPerfume && v.anio != null && <span className="text-neutral-500 font-normal"> {v.anio}</span>}
        </h3>
        <p className="text-emerald-700 font-extrabold">{fmt(v.precio)}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs">
          {isPerfume ? (
            v.ml != null && <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">{v.ml} ml</span>
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
          className="mt-4 inline-block bg-yellow-400 text-black px-4 py-2 rounded-2xl font-semibold shadow hover:bg-yellow-300 text-center"
        >
          {isPerfume ? "Ver perfume" : "Cotizar"}
        </Link>
      </div>
    </div>
  );
}
