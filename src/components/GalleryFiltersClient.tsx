"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  brands: string[];           // marcas disponibles
  categories: string[];       // categorías disponibles (ej: ["DISEÑADOR","ARABES","NICHO","OTROS"])
};

const split = (s?: string) => (s ? s.split(",").filter(Boolean) : []);
const join  = (a: string[]) => a.filter(Boolean).join(",");

export default function GalleryFiltersClient({ brands, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Estado "pendiente" local, inicializado desde la URL
  const [tipos, setTipos] = useState<string[]>(split(sp.get("tipos") || ""));
  const [marcas, setMarcas] = useState<string[]>(split(sp.get("marcas") || ""));
  const [priceMin, setPriceMin] = useState<string>(sp.get("priceMin") || "");
  const [priceMax, setPriceMax] = useState<string>(sp.get("priceMax") || "");

  // helpers de toggle
  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  // Construye la URL solo al aplicar
  const apply = () => {
    const qp = new URLSearchParams(sp.toString());
    tipos.length ? qp.set("tipos", join(tipos)) : qp.delete("tipos");
    marcas.length ? qp.set("marcas", join(marcas)) : qp.delete("marcas");
    priceMin ? qp.set("priceMin", priceMin) : qp.delete("priceMin");
    priceMax ? qp.set("priceMax", priceMax) : qp.delete("priceMax");
    router.push(`${pathname}?${qp.toString()}`);
  };

  // Limpia formulario local y URL
  const clear = () => {
    setTipos([]); setMarcas([]); setPriceMin(""); setPriceMax("");
    const qp = new URLSearchParams(sp.toString());
    ["tipos","marcas","priceMin","priceMax"].forEach(k => qp.delete(k));
    router.push(`${pathname}?${qp.toString()}`);
  };

  const selectedCount = useMemo(
    () => tipos.length + marcas.length + (priceMin?1:0) + (priceMax?1:0),
    [tipos, marcas, priceMin, priceMax]
  );

  return (
    <aside className="space-y-4">
      {/* Categorías */}
      <div>
        <h3 className="font-semibold mb-2">Categorías</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setTipos(t => toggle(t, c))}
              className={`px-3 py-1.5 rounded-full border ${
                tipos.includes(c) ? "bg-blue-600 text-white border-blue-600" : "bg-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Marcas */}
      <div>
        <h3 className="font-semibold mb-2">Marcas</h3>
        <div className="flex flex-wrap gap-2">
          {brands.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMarcas(x => toggle(x, m))}
              className={`px-3 py-1.5 rounded-full border ${
                marcas.includes(m) ? "bg-slate-900 text-white border-slate-900" : "bg-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div className="flex items-center gap-3">
        <input
          inputMode="numeric"
          placeholder="Mín"
          value={priceMin}
          onChange={e => setPriceMin(e.target.value.replace(/\D/g,""))}
          className="w-24 px-2 py-1 border rounded"
        />
        <span className="text-slate-500">—</span>
        <input
          inputMode="numeric"
          placeholder="Máx"
          value={priceMax}
          onChange={e => setPriceMax(e.target.value.replace(/\D/g,""))}
          className="w-24 px-2 py-1 border rounded"
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <button onClick={apply} className="px-4 py-2 rounded bg-blue-600 text-white">
          Aplicar filtros {selectedCount ? `(${selectedCount})` : ""}
        </button>
        <button onClick={clear} className="px-4 py-2 rounded border">
          Limpiar
        </button>
      </div>
    </aside>
  );
}
