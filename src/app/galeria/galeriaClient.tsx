"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import VehicleCard, { Vehiculo } from "@/components/VehicleCard";
import Link from "next/link";

/* ====== Categorías ====== */
const CATS = ["NICHO", "ARABES", "DISEÑADOR", "OTROS"] as const;
type Categoria = typeof CATS[number];

function parseFromSearch(sp: ReturnType<typeof useSearchParams>): Filtros {
  const readArr = (key: string) =>
    (sp.get(key)?.split(",").map(s => s.trim()).filter(Boolean)) || [];
  const tipos = readArr("tipos").filter(v => CATS.includes(v as Categoria)) as Categoria[];
  return {
    marcas: readArr("marcas"),
    tipos,
    priceMin: sp.get("priceMin") ? Number(sp.get("priceMin")) : null,
    priceMax: sp.get("priceMax") ? Number(sp.get("priceMax")) : null,
    q: sp.get("q") || "",
  };
}

/* ====== Config S3 ====== */
const S3_BASE = (process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const FALLBACK_IMG = S3_BASE
  ? `${S3_BASE}/placeholders/placeholder.webp`
  : "https://via.placeholder.com/800x600?text=Imagen";
const resolveImg = (src?: string) =>
  !src ? "" : /^https?:\/\//i.test(src) ? src : `${S3_BASE}/${src.replace(/^\/+/, "")}`;

/* ====== API ====== */
type ApiPerfume = {
  id: string;
  nombre: string;
  marca: string;
  ml: number;
  precio: number;
  imagen?: string;
  imagenes?: string[];
  categoria?: Categoria;
};

/* ====== Item local: Vehiculo + categoría ====== */
type Item = Vehiculo & { categoria?: Categoria };

/* ====== Filtros ====== */
type Filtros = {
  marcas: string[];
  tipos: Categoria[];
  priceMin: number | null;
  priceMax: number | null;
  q: string;
};

export default function GaleriaClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [page, setPage] = useState(1);
  const perfumesPorPagina = 16;

  const initial = useMemo(() => parseFromSearch(sp), [sp]);

  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/perfumes")
      .then(r => r.json() as Promise<ApiPerfume[]>)
      .then(rows => {
        const mapped: Item[] = rows.map(p => ({
          id: p.id,
          marca: p.marca ?? "N/D",
          modelo: p.nombre ?? "N/D",
          anio: 0,
          ml: p.ml,
          precio: p.precio ?? 0,
          categoria: p.categoria ?? "OTROS",
          imagen: resolveImg(p.imagenes?.[0] ?? p.imagen) || FALLBACK_IMG,
        }));
        setItems(mapped);
      })
      .catch(() => {});
  }, []);

  const bounds = useMemo(() => {
    const precios = items.map(v => v.precio ?? 0).filter(Number.isFinite);
    const min = precios.length ? Math.min(...precios) : null;
    const max = precios.length ? Math.max(...precios) : null;
    return { precioMin: min, precioMax: max };
  }, [items]);

  const [filtros, setFiltros] = useState<Filtros>(() => ({
    ...initial,
    priceMin: initial.priceMin ?? (bounds.precioMin ?? null),
    priceMax: initial.priceMax ?? (bounds.precioMax ?? null),
  }));

  useEffect(() => {
    const next = parseFromSearch(sp);
    setFiltros(f => ({
      ...f,
      ...next,
      priceMin: next.priceMin ?? (bounds.precioMin ?? null),
      priceMax: next.priceMax ?? (bounds.precioMax ?? null),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, bounds.precioMin, bounds.precioMax]);

  const opciones = useMemo(() => {
    const uniq = (arr: (string | undefined)[]) =>
      Array.from(new Set(arr.filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "es"));
    return {
      marcas: uniq(items.map(v => v.marca)),
      tipos: CATS.slice(),
    };
  }, [items]);

  const aplicarFiltros = useCallback(
    (base: Item[]) =>
      base.filter(v => {
        if (filtros.marcas.length && !filtros.marcas.includes(v.marca ?? "")) return false;
        if (filtros.tipos.length && !filtros.tipos.includes((v.categoria as Categoria) ?? "OTROS")) return false;
        if (filtros.priceMin != null && (v.precio ?? 0) < filtros.priceMin) return false;
        if (filtros.priceMax != null && (v.precio ?? 0) > filtros.priceMax) return false;
        if (filtros.q) {
          const h = `${v.marca ?? ""} ${v.modelo ?? ""}`.toLowerCase();
          if (!h.includes(filtros.q.toLowerCase())) return false;
        }
        return true;
      }),
    [filtros]
  );

  function countBy<T>(arr: T[], pick: (t: T) => string | undefined): Map<string, number> {
    const m = new Map<string, number>();
    for (const v of arr) {
      const k = pick(v);
      if (!k) continue;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }

  const facetCounts = useMemo(() => {
    const base = aplicarFiltros(items);
    return {
      marcas: countBy(base, v => (v as Item).marca),
      categorias: countBy(base, v => (v as Item).categoria),
      resultados: base.length,
    };
  }, [items, aplicarFiltros]);

  const listaFiltrada = useMemo(() => aplicarFiltros(items), [items, aplicarFiltros]);

  // Paginación
  const totalPaginas = Math.ceil(listaFiltrada.length / perfumesPorPagina);
  const lista = useMemo(
    () =>
      listaFiltrada.slice(
        (page - 1) * perfumesPorPagina,
        page * perfumesPorPagina
      ),
    [listaFiltrada, page]
  );

  // Resetear a la primera página si cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [filtros, listaFiltrada.length]);

  const toggleMarca = (value: string) =>
    setFiltros(f => {
      const set = new Set(f.marcas);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...f, marcas: Array.from(set) };
    });

  const toggleTipo = (value: Categoria) =>
    setFiltros(f => {
      const set = new Set(f.tipos);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...f, tipos: Array.from(set) as Categoria[] };
    });

  const setRange = (key: keyof Pick<Filtros, "priceMin" | "priceMax">, value: number | null) =>
    setFiltros(f => ({ ...f, [key]: value }));

  const clearAll = () => {
    setFiltros({
      marcas: [],
      tipos: [],
      priceMin: bounds.precioMin ?? null,
      priceMax: bounds.precioMax ?? null,
      q: "",
    });
    router.replace(pathname, { scroll: false });
  };

  const [showFilters, setShowFilters] = useState(false);

  const hasAnyFilter =
    filtros.marcas.length > 0 ||
    filtros.tipos.length > 0 ||
    !!filtros.q ||
    filtros.priceMin != null ||
    filtros.priceMax != null;

  const hrefAplicar = useMemo(() => {
    const qp = new URLSearchParams();
    if (filtros.q) qp.set("q", filtros.q);
    if (filtros.marcas.length) qp.set("marcas", filtros.marcas.join(","));
    if (filtros.tipos.length) qp.set("tipos", filtros.tipos.join(","));
    if (filtros.priceMin != null) qp.set("priceMin", String(filtros.priceMin));
    if (filtros.priceMax != null) qp.set("priceMax", String(filtros.priceMax));
    return `/galeria?${qp.toString()}`;
  }, [filtros]);

  // Buscador por nombre de perfume (además del filtro actual)
  // El filtro por nombre ya está implementado en filtros.q, pero puedes agregar un input visible arriba
  // para mejorar la experiencia de usuario.

  return (
    <main className="pt-28 md:pt-36 min-h-screen bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      {/* HERO */}
      <section className="h-[30vh] md:h-[36vh] flex flex-col justify-center items-center text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-extrabold mb-2"
        >
          Nuestros perfumes
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg md:text-2xl max-w-2xl"
        >
          Filtra y encuentra tu fragancia.
        </motion.p>
      </section>

      {/* Buscador por nombre */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <input
          type="text"
          value={filtros.q}
          onChange={e => setFiltros(f => ({ ...f, q: e.target.value }))}
          placeholder="Buscar perfume por nombre..."
          className="w-full px-4 py-2 rounded-lg bg-white/10 placeholder-white/60 text-white"
        />
      </div>

      {/* CONTENIDO */}
      <section className="py-8 px-6 md:px-16 max-w-7xl mx-auto">
        {/* Botón filtros + chips */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowFilters(s => !s)}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
            aria-expanded={showFilters}
            aria-controls="panel-filtros"
          >
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {filtros.marcas.map(m => (
              <Chip key={`m-${m}`} label={`Marca: ${m}`} onClear={() => toggleMarca(m)} />
            ))}
            {filtros.tipos.map(t => (
              <Chip key={`t-${t}`} label={`Categoría: ${t}`} onClear={() => toggleTipo(t)} />
            ))}
            {(filtros.priceMin != null || filtros.priceMax != null) && (
              <span className="px-3 py-1 rounded-full border border-white/15 bg-white/10 text-sm">
                Precio: {filtros.priceMin?.toLocaleString("es-CL") ?? "0"} –{" "}
                {filtros.priceMax?.toLocaleString("es-CL") ?? "∞"}
              </span>
            )}
            {hasAnyFilter ? (
              <Link href="/galeria" className="text-sm underline text-white/80 hover:text-white">
                Reset URL
              </Link>
            ) : null}
          </div>
        </div>

        {/* Panel filtros */}
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

                <Facet
                  titulo={`Marca (${facetCounts.resultados})`}
                  opciones={opciones.marcas}
                  seleccionadas={filtros.marcas}
                  counts={facetCounts.marcas}
                  onToggle={toggleMarca}
                />

                <Facet
                  titulo="Categoría"
                  opciones={opciones.tipos}
                  seleccionadas={filtros.tipos}
                  counts={facetCounts.categorias}
                  onToggle={(v) => toggleTipo(v as Categoria)}
                />

                <RangeGroup
                  titulo="Precio (CLP)"
                  min={bounds.precioMin}
                  max={bounds.precioMax}
                  valMin={filtros.priceMin}
                  valMax={filtros.priceMax}
                  onMin={(v: number | null) => setRange("priceMin", v)}
                  onMax={(v: number | null) => setRange("priceMax", v)}
                  step={1000}
                />

                <div className="md:col-span-4 flex gap-3">
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    Limpiar filtros
                  </button>

                  <Link
                    href={hrefAplicar}
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    Aplicar
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resultados */}
        {lista.length === 0 ? (
          <p className="text-white/80">No se encontraron perfumes con esos filtros.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lista.map((v: Item) => (
                <VehicleCard key={v.id} v={v} compact />
              ))}
            </div>
            {/* Paginador */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  {"<"}
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-1 border rounded ${
                      n === page ? "bg-blue-500 text-white" : ""
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPaginas}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  {">"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

/* ---------- UI helpers ---------- */

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="px-3 py-1 rounded-full border border-white/15 bg-white/10 text-sm flex items-center gap-2">
      {label}
      <button onClick={onClear} aria-label="Quitar" className="hover:opacity-80">
        ×
      </button>
    </span>
  );
}

function Facet<T extends string>(props: {
  titulo: string;
  opciones: T[];
  seleccionadas: T[];
  counts: Map<string, number>;
  onToggle: (v: T) => void;
}) {
  const { titulo, opciones, seleccionadas, counts, onToggle } = props;
  return (
    <div>
      <h3 className="font-semibold mb-2">{titulo}</h3>
      <div className="space-y-2 max-h-48 overflow-auto pr-1">
        {opciones.length === 0 && <p className="text-sm text-white/70">Sin opciones</p>}
        {opciones.map((opt: T) => {
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
  const { titulo, min, max, valMin, valMax, onMin, onMax, step = 1000 } = props;
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
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valMin ?? min}
        onChange={e => onMin(Number(e.target.value))}
        className="w-full"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valMax ?? max}
        onChange={e => onMax(Number(e.target.value))}
        className="w-full"
      />
      <p className="text-xs text-white/70">Actual: {valMin ?? min} – {valMax ?? max}</p>
    </div>
  );
}