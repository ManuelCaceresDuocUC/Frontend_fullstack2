"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import VehicleCard, { Vehiculo } from "@/components/VehicleCard";
import Link from "next/link";

// Tipado de respuesta de tu API
type ApiVehiculo = Partial<{
  id: string;
  brand: string;  marca: string;
  model: string;  modelo: string;
  year: number;   anio: number;
  priceCLP: number; precio: number;
  images: string[]; imagen: string;
  tipo: string;
  combustible: string;
  transmision: string;
}>;

type Filtros = {
  marcas: string[];
  tipos: string[];
  combustibles: string[];
  transmisiones: string[];
  priceMin: number | null;
  priceMax: number | null;
  anioMin: number | null;
  anioMax: number | null;
  q: string;
};

type KeyFacet = "marca" | "tipo" | "combustible" | "transmision";

// Base mock. Cambia por tu fuente si quieres.
const VEHICULOS: Vehiculo[] = [
  { id: "1", marca: "Toyota", modelo: "RAV4", anio: 2021, precio: 17990000, tipo: "suv", combustible: "gasolina", transmision: "automatica", imagen: "/gallery/1.jpg" },
  { id: "2", marca: "Hyundai", modelo: "Tucson", anio: 2020, precio: 16490000, tipo: "suv", combustible: "diesel", transmision: "automatica", imagen: "/gallery/2.jpg" },
  { id: "3", marca: "Kia", modelo: "Rio 5", anio: 2019, precio: 7490000, tipo: "hatchback", combustible: "gasolina", transmision: "manual", imagen: "/gallery/3.jpeg" },
  { id: "4", marca: "Chevrolet", modelo: "Sail", anio: 2018, precio: 5890000, tipo: "sedan", combustible: "gasolina", transmision: "manual", imagen: "/gallery/4.webp" },
  { id: "5", marca: "Ford", modelo: "Ranger", anio: 2022, precio: 22990000, tipo: "pickup", combustible: "diesel", transmision: "manual", imagen: "/gallery/5.jpg" },
  { id: "6", marca: "Suzuki", modelo: "Swift", anio: 2021, precio: 8990000, tipo: "hatchback", combustible: "gasolina", transmision: "cvt", imagen: "/gallery/6.webp" },
  { id: "7", marca: "Nissan", modelo: "X-Trail", anio: 2022, precio: 19990000, tipo: "suv", combustible: "hibrido", transmision: "cvt", imagen: "/gallery/7.jpeg" },
  { id: "8", marca: "BYD", modelo: "Han", anio: 2023, precio: 32990000, tipo: "sedan", combustible: "electrico", transmision: "automatica", imagen: "/gallery/8.webp" },
  { id: "9", marca: "Toyota", modelo: "RAV4", anio: 2021, precio: 17990000, tipo: "suv", combustible: "gasolina", transmision: "automatica", imagen: "/gallery/1.jpg" },
  { id: "10", marca: "Yamaha", modelo: "R3", anio: 2022, precio: 4290000, tipo: "motocicleta", combustible: "gasolina", transmision: "manual", imagen: "/gallery/10.jpg" },
];

export default function GaleriaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const q = useSearchParams();

  const readArr = (key: string) =>
    (q.get(key)?.split(",").map(s => s.trim()).filter(Boolean)) || [];

  const initial: Filtros = {
    marcas: readArr("marcas"),
    tipos: readArr("tipos"),
    combustibles: readArr("combustibles"),
    transmisiones: readArr("transmisiones"),
    priceMin: q.get("priceMin") ? Number(q.get("priceMin")) : null,
    priceMax: q.get("priceMax") ? Number(q.get("priceMax")) : null,
    anioMin: q.get("anioMin") ? Number(q.get("anioMin")) : null,
    anioMax: q.get("anioMax") ? Number(q.get("anioMax")) : null,
    q: q.get("q") || "",
  };

  const [extras, setExtras] = useState<Vehiculo[]>([]);
  useEffect(() => {
    fetch("/api/vehiculos")
      .then(r => r.json() as Promise<ApiVehiculo[]>) // ← sin any
      .then((rows) => {
        const mapped: Vehiculo[] = rows.map((r) => ({
          id: r.id ?? crypto.randomUUID(),
          marca: r.brand ?? r.marca ?? "N/D",
          modelo: r.model ?? r.modelo ?? "N/D",
          anio: r.year ?? r.anio ?? 0,
          precio: r.priceCLP ?? r.precio ?? 0,
          // assertions para cumplir el union del tipo Vehiculo
          tipo: (r.tipo ?? "suv") as Vehiculo["tipo"],
          combustible: (r.combustible ?? "gasolina") as Vehiculo["combustible"],
          transmision: (r.transmision ?? "manual") as Vehiculo["transmision"],
          imagen: (Array.isArray(r.images) ? r.images[0] : r.imagen) ?? "/gallery/1.jpg",
        }));
        setExtras(mapped);
      })
      .catch(() => {});
  }, []);

  const ALL = useMemo(() => [...VEHICULOS, ...extras], [extras]);

  const bounds = useMemo(() => {
    const precios = ALL.map(v => v.precio ?? 0).filter((n): n is number => Number.isFinite(n));
    const anios = ALL.map(v => v.anio ?? 0).filter((n): n is number => Number.isFinite(n) && n > 0);
    const min = (arr: number[]) => (arr.length ? Math.min(...arr) : null);
    const max = (arr: number[]) => (arr.length ? Math.max(...arr) : null);
    return {
      precioMin: min(precios), precioMax: max(precios),
      anioMin: min(anios), anioMax: max(anios),
    };
  }, [ALL]);

  const [filtros, setFiltros] = useState<Filtros>(() => ({
    ...initial,
    priceMin: initial.priceMin ?? (bounds.precioMin ?? null),
    priceMax: initial.priceMax ?? (bounds.precioMax ?? null),
    anioMin: initial.anioMin ?? (bounds.anioMin ?? null),
    anioMax: initial.anioMax ?? (bounds.anioMax ?? null),
  }));

  useEffect(() => {
    setFiltros(f => ({
      ...f,
      priceMin: f.priceMin ?? (bounds.precioMin ?? null),
      priceMax: f.priceMax ?? (bounds.precioMax ?? null),
      anioMin: f.anioMin ?? (bounds.anioMin ?? null),
      anioMax: f.anioMax ?? (bounds.anioMax ?? null),
    }));
  }, [bounds.precioMin, bounds.precioMax, bounds.anioMin, bounds.anioMax]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      const putArr = (k: string, arr: string[]) => arr.length && params.set(k, arr.join(","));
      putArr("marcas", filtros.marcas);
      putArr("tipos", filtros.tipos);
      putArr("combustibles", filtros.combustibles);
      putArr("transmisiones", filtros.transmisiones);
      if (filtros.priceMin != null) params.set("priceMin", String(filtros.priceMin));
      if (filtros.priceMax != null) params.set("priceMax", String(filtros.priceMax));
      if (filtros.anioMin != null) params.set("anioMin", String(filtros.anioMin));
      if (filtros.anioMax != null) params.set("anioMax", String(filtros.anioMax));
      if (filtros.q) params.set("q", filtros.q);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 150);
    return () => clearTimeout(t);
  }, [filtros, pathname, router]);

  const opciones = useMemo(() => {
    const uniq = (arr: (string | undefined)[]) =>
      Array.from(new Set(arr.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "es"));
    return {
      marcas: uniq(ALL.map(v => v.marca)),
      tipos: uniq(ALL.map(v => v.tipo)),
      combustibles: uniq(ALL.map(v => v.combustible)),
      transmisiones: uniq(ALL.map(v => v.transmision)),
    };
  }, [ALL]);

  function aplicarFiltros(base: Vehiculo[], skip?: keyof Filtros) {
    return base.filter(v => {
      if (skip !== "marcas" && filtros.marcas.length && !filtros.marcas.includes(v.marca ?? "")) return false;
      if (skip !== "tipos" && filtros.tipos.length && !filtros.tipos.includes(v.tipo ?? "")) return false;
      if (skip !== "combustibles" && filtros.combustibles.length && !filtros.combustibles.includes(v.combustible ?? "")) return false;
      if (skip !== "transmisiones" && filtros.transmisiones.length && !filtros.transmisiones.includes(v.transmision ?? "")) return false;

      if (skip !== "priceMin" && filtros.priceMin != null && (v.precio ?? 0) < filtros.priceMin) return false;
      if (skip !== "priceMax" && filtros.priceMax != null && (v.precio ?? 0) > filtros.priceMax) return false;
      if (skip !== "anioMin" && filtros.anioMin != null && (v.anio ?? 0) < filtros.anioMin) return false;
      if (skip !== "anioMax" && filtros.anioMax != null && (v.anio ?? 0) > filtros.anioMax) return false;

      if (skip !== "q" && filtros.q) {
        const h = `${v.marca ?? ""} ${v.modelo ?? ""}`.toLowerCase();
        if (!h.includes(filtros.q.toLowerCase())) return false;
      }
      return true;
    });
  }

  const countBy = (arr: Vehiculo[], key: KeyFacet) => {
    const m = new Map<string, number>();
    arr.forEach(v => {
      const k = v[key];
      if (!k) return;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return m;
  };

  const facetCounts = useMemo(() => {
    const base = aplicarFiltros(ALL);
    return {
      marcas: countBy(aplicarFiltros(ALL, "marcas"), "marca"),
      tipos: countBy(aplicarFiltros(ALL, "tipos"), "tipo"),
      combustibles: countBy(aplicarFiltros(ALL, "combustibles"), "combustible"),
      transmisiones: countBy(aplicarFiltros(ALL, "transmisiones"), "transmision"),
      resultados: base.length,
    };
  }, [ALL, filtros]);

  const lista = useMemo(() => aplicarFiltros(ALL), [ALL, filtros]);

  const toggle = (key: keyof Pick<Filtros, "marcas" | "tipos" | "combustibles" | "transmisiones">, value: string) =>
    setFiltros(f => {
      const set = new Set(f[key]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...f, [key]: Array.from(set) };
    });

  const setRange = (key: keyof Filtros, value: number | null) =>
    setFiltros(f => ({ ...f, [key]: value }));

  const clearAll = () => {
    setFiltros({
      marcas: [], tipos: [], combustibles: [], transmisiones: [],
      priceMin: bounds.precioMin ?? null, priceMax: bounds.precioMax ?? null,
      anioMin: bounds.anioMin ?? null, anioMax: bounds.anioMax ?? null,
      q: "",
    });
    router.replace(pathname, { scroll: false });
  };

  const [showFilters, setShowFilters] = useState(false);


  return (
    <main className="pt-28 md:pt-36 min-h-screen bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      {/* HERO */}
      <section className="h-[30vh] md:h-[36vh] flex flex-col justify-center items-center text-center px-4">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-4xl md:text-6xl font-extrabold mb-2">
          Nuestros vehículos
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="text-lg md:text-2xl max-w-2xl">
          Filtra, elige y cotiza... asi de fácil.
        </motion.p>
      </section>

      {/* CONTENIDO */}
      <section className="py-8 px-6 md:px-16 max-w-7xl mx-auto">
        {/* Botón filtros */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowFilters(s => !s)}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
            aria-expanded={showFilters}
            aria-controls="panel-filtros"
          >
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>

          {/* Chips resumen */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {filtros.marcas.map(m => <Chip key={`m-${m}`} label={`Marca: ${m}`} onClear={() => toggle("marcas", m)} />)}
            {filtros.tipos.map(t => <Chip key={`t-${t}`} label={`Tipo: ${t}`} onClear={() => toggle("tipos", t)} />)}
            {filtros.combustibles.map(c => <Chip key={`c-${c}`} label={`Comb.: ${c}`} onClear={() => toggle("combustibles", c)} />)}
            {filtros.transmisiones.map(tr => <Chip key={`tr-${tr}`} label={`Transm.: ${tr}`} onClear={() => toggle("transmisiones", tr)} />)}
            {(filtros.priceMin != null || filtros.priceMax != null) && (
              <span className="px-3 py-1 rounded-full border border-white/15 bg-white/10 text-sm">
                Precio: {filtros.priceMin?.toLocaleString("es-CL") ?? "0"} – {filtros.priceMax?.toLocaleString("es-CL") ?? "∞"}
              </span>
            )}
            {(filtros.anioMin != null || filtros.anioMax != null) && (
              <span className="px-3 py-1 rounded-full border border-white/15 bg-white/10 text-sm">
                Año: {filtros.anioMin ?? "0"} – {filtros.anioMax ?? "∞"}
              </span>
            )}
            {(filtros.marcas.length || filtros.tipos.length || filtros.combustibles.length || filtros.transmisiones.length || filtros.q || filtros.priceMin != null || filtros.priceMax != null || filtros.anioMin != null || filtros.anioMax != null) && (
              <Link href="/galeria" className="text-sm underline text-white/80 hover:text-white">Reset URL</Link>
            )}
          </div>
        </div>

        {/* Panel filtros desplegable */}
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              id="panel-filtros"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="bg-white/10 rounded-2xl p-4 grid md:grid-cols-4 gap-6 mb-8">
                <div className="md:col-span-1">
                  <input
                    value={filtros.q}
                    onChange={e => setFiltros(f => ({ ...f, q: e.target.value }))}
                    placeholder="Buscar marca o modelo"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 placeholder-white/60"
                  />
                </div>

                <Facet titulo={`Marca (${facetCounts.resultados})`} opciones={opciones.marcas} seleccionadas={filtros.marcas} counts={facetCounts.marcas} onToggle={(v) => toggle("marcas", v)} />
                <Facet titulo="Tipo" opciones={opciones.tipos} seleccionadas={filtros.tipos} counts={facetCounts.tipos} onToggle={(v) => toggle("tipos", v)} />
                <Facet titulo="Combustible" opciones={opciones.combustibles} seleccionadas={filtros.combustibles} counts={facetCounts.combustibles} onToggle={(v) => toggle("combustibles", v)} />
                <Facet titulo="Transmisión" opciones={opciones.transmisiones} seleccionadas={filtros.transmisiones} counts={facetCounts.transmisiones} onToggle={(v) => toggle("transmisiones", v)} />

                <RangeGroup
                  titulo="Precio (CLP)"
                  min={bounds.precioMin} max={bounds.precioMax}
                  valMin={filtros.priceMin} valMax={filtros.priceMax}
                  onMin={(v) => setRange("priceMin", v)} onMax={(v) => setRange("priceMax", v)}
                  step={50000}
                />

                <RangeGroup
                  titulo="Año"
                  min={bounds.anioMin} max={bounds.anioMax}
                  valMin={filtros.anioMin} valMax={filtros.anioMax}
                  onMin={(v) => setRange("anioMin", v)} onMax={(v) => setRange("anioMax", v)}
                  step={1}
                />

                <div className="md:col-span-4 flex gap-3">
                  <button onClick={clearAll} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">Limpiar filtros</button>
                  <button onClick={() => setShowFilters(false)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">Aplicar</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resultados */}
        {lista.length === 0 ? (
          <p className="text-white/80">No se encontraron vehículos con esos filtros.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((v) => (
              <VehicleCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* ---------- UI helpers ---------- */

function Facet(props: {
  titulo: string;
  opciones: string[];
  seleccionadas: string[];
  counts: Map<string, number>;
  onToggle: (v: string) => void;
}) {
  const { titulo, opciones, seleccionadas, counts, onToggle } = props;
  return (
    <div>
      <h3 className="font-semibold mb-2">{titulo}</h3>
      <div className="space-y-2 max-h-48 overflow-auto pr-1">
        {opciones.length === 0 && <p className="text-sm text-white/70">Sin opciones</p>}
        {opciones.map(opt => {
          const c = counts.get(opt) ?? 0;
          const checked = seleccionadas.includes(opt);
          const disabled = c === 0 && !checked;
          return (
            <label key={opt} className={`flex items-center gap-2 text-sm ${disabled ? "opacity-40" : ""}`}>
              <input type="checkbox" disabled={disabled} checked={checked} onChange={() => onToggle(opt)} />
              <span>{opt}</span>
              <span className="ml-auto text-white/70">{c}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RangeGroup(props: {
  titulo: string;
  min: number | null; max: number | null;
  valMin: number | null; valMax: number | null;
  onMin: (v: number | null) => void; onMax: (v: number | null) => void;
  step?: number;
}) {
  const { titulo, min, max, valMin, valMax, onMin, onMax, step = 1 } = props;
  if (min == null || max == null) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{titulo}</h3>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          className="px-2 py-1 rounded bg-white/10"
          placeholder={`min ${min}`}
          value={valMin ?? ""}
          onChange={e => onMin(e.target.value === "" ? null : Number(e.target.value))}
        />
        <input
          type="number"
          className="px-2 py-1 rounded bg-white/10"
          placeholder={`max ${max}`}
          value={valMax ?? ""}
          onChange={e => onMax(e.target.value === "" ? null : Number(e.target.value))}
        />
      </div>
      <input type="range" min={min} max={max} step={step} value={valMin ?? min} onChange={e => onMin(Number(e.target.value))} className="w-full" />
      <input type="range" min={min} max={max} step={step} value={valMax ?? max} onChange={e => onMax(Number(e.target.value))} className="w-full" />
      <p className="text-xs text-white/70">Actual: {valMin ?? min} – {valMax ?? max}</p>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="px-3 py-1 rounded-full border border-white/15 bg-white/10 text-sm flex items-center gap-2">
      {label}
      <button onClick={onClear} aria-label="Quitar" className="hover:opacity-80">×</button>
    </span>
  );
}
