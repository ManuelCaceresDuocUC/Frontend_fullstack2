"use client";

import Image from "next/image";
import Link from "next/link";

export type Vehiculo = {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  tipo: "suv" | "sedan" | "hatchback" | "pickup" | "4x4" | "motocicleta";
  combustible: "gasolina" | "diesel" | "hibrido" | "electrico";
  transmision: "manual" | "automatica" | "cvt";
  cilindradaCc?: number;     // <-- nuevo
  imagen: string;
};
const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default function VehicleCard({ v }: { v: Vehiculo }) {
  const asunto = encodeURIComponent(`Cotización ${v.marca} ${v.modelo} ${v.anio}`);
  return (
   <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur shadow-lg overflow-hidden">
  <div className="relative w-full h-52">
    <Image src={v.imagen} alt={`${v.marca} ${v.modelo}`} fill className="object-cover" />
    {/* oscurece un poco la foto para que el texto resalte */}
    <div className="absolute inset-0 bg-black/20 pointer-events-none" />
  </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900">
          {v.marca} {v.modelo} <span className="text-gray-500">{v.anio}</span>
        </h3>
        <p className="mt-1 text-blue-700 font-bold">{fmt(v.precio)}</p>

        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-yellow border border-gray-200">{v.tipo.toUpperCase()}</span>
          <span className="px-2 py-1 rounded-full bg-yellow border border-gray-200">{v.combustible}</span>
          <span className="px-2 py-1 rounded-full bg-yellow border border-gray-200">{v.transmision}</span>
        </div>

        <Link
          href={`/contact?asunto=${asunto}`}
          className="mt-4 inline-block bg-yellow-400 text-black px-4 py-2 rounded-2xl font-semibold shadow hover:bg-yellow-300 text-center"
        >
          Cotizar
        </Link>
      </div>
    </div>
  );
}
