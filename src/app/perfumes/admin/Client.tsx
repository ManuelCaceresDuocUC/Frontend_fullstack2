// src/app/perfumes/admin/Client.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getJSON } from "@/lib/http";

type Categoria = "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";

export type Row = {
  id: string;
  nombre: string;
  marca: string;
  ml: number;
  precio: number;
  imagenes: string[];
  categoria: "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";
  qty?: number;            // <- antes: qty: number
  descripcion?: string;
};

type ApiPerfumeDTO = {
  id: string;
  nombre: string;
  marca: string;
  ml: number;
  precio: number;
  imagenes?: unknown;
  categoria?: string;
  stock?: number;
  descripcion?: string;
};

type StockVariantDTO = { id: string; ml: number; price: number; stock: number; active: boolean };

const CATS = ["NICHO", "ARABES", "DISEÑADOR", "OTROS"] as const;
const ML = [3, 5, 10] as const;

const S3_BASE = (process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const toUrl = (key: string) => (S3_BASE ? `${S3_BASE}/${key.replace(/^\/+/, "")}` : key);

const money = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

async function uploadToS3(file: File, brand: string): Promise<string> {
  const q = new URLSearchParams({ filename: file.name, type: file.type, brand });
  const { signedUrl, key } = await getJSON<{ signedUrl: string; key: string }>(`/api/s3/presign?${q}`);
  const put = await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!put.ok) throw new Error("S3 upload failed");
  return key;
}

type VariantMap = Record<number, { stock: number; price: number; variantId?: string; active?: boolean }>;

export default function Client({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [variants, setVariants] = useState<Record<string, VariantMap>>({}); // por perfumeId
  const [savingId, setSavingId] = useState<string | null>(null);
  const filePickers = useRef<Record<string, HTMLInputElement | null>>({});

  // Carga base + variantes
  useEffect(() => {
    fetch("/api/perfumes")
      .then((r) => r.json() as Promise<unknown>)
      .then(async (raw) => {
        const arr = Array.isArray(raw) ? (raw as unknown[]) : [];
        const base: Row[] = arr.map((dRaw) => {
          const d = dRaw as Partial<ApiPerfumeDTO>;
          const imgs = Array.isArray(d.imagenes) ? d.imagenes.filter((x): x is string => typeof x === "string") : [];
          return {
            id: String(d.id ?? ""),
            nombre: String(d.nombre ?? ""),
            marca: String(d.marca ?? ""),
            ml: Number.isFinite(Number(d.ml)) ? Number(d.ml) : 0,
            precio: Number.isFinite(Number(d.precio)) ? Number(d.precio) : 0,
            imagenes: imgs,
            categoria: ((d.categoria as Categoria) ?? "OTROS"),
            qty: Number.isFinite(Number(d.stock)) ? Number(d.stock) : 0,
            descripcion: typeof d.descripcion === "string" ? d.descripcion : "",
          };
        });
        setRows(base);

        // Trae variantes para cada perfume
        const all = await Promise.all(
          base.map((p) =>
            fetch(`/api/stock/${p.id}`)
              .then((r) => r.json() as Promise<{ perfumeId: string; variants: StockVariantDTO[] }>)
              .catch(() => ({ perfumeId: p.id, variants: [] as StockVariantDTO[] }))
          )
        );
        const next: Record<string, VariantMap> = {};
        for (const r of all) {
          const map: VariantMap = {};
          for (const ml of ML) {
            const v = r.variants.find((x) => x.ml === ml);
            map[ml] = { stock: v?.stock ?? 0, price: v?.price ?? 0, variantId: v?.id, active: v?.active };
          }
          next[r.perfumeId] = map;
        }
        setVariants(next);
      })
      .catch(() => {});
  }, []);

  const setFilePickerRef = (id: string) => (el: HTMLInputElement | null) => {
    filePickers.current[id] = el;
  };

  const setPrecio = (id: string, precio: number) =>
    setRows((rs) => rs.map((p) => (p.id === id ? { ...p, precio: Number.isFinite(precio) ? precio : 0 } : p)));

  const setCategoria = (id: string, categoria: Categoria) =>
    setRows((rs) => rs.map((p) => (p.id === id ? { ...p, categoria } : p)));

  const setDescripcion = (id: string, descripcion: string) =>
    setRows((rs) => rs.map((p) => (p.id === id ? { ...p, descripcion } : p)));

  // ===== Variantes =====
  const setVarStock = (perfumeId: string, ml: number, next: number) =>
    setVariants((vs) => ({
      ...vs,
      [perfumeId]: { ...(vs[perfumeId] ?? {}), [ml]: { ...(vs[perfumeId]?.[ml] ?? { price: 0 }), stock: Math.max(0, next) } },
    }));

  const saveVar = async (perfumeId: string, ml: number) => {
    const stock = variants[perfumeId]?.[ml]?.stock ?? 0;
    setSavingId(`${perfumeId}:${ml}`);
    const ok = await fetch(`/api/stock/${perfumeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ml, stock }),
    })
      .then((r) => r.ok)
      .catch(() => false);
    setSavingId(null);
    if (!ok) alert(`No se pudo guardar el stock de ${ml} ml`);
  };

  const saveAllVars = async (perfumeId: string) => {
    setSavingId(perfumeId);
    const map = variants[perfumeId] ?? {};
    const ok = await Promise.all(
      ML.map((ml) =>
        fetch(`/api/stock/${perfumeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ml, stock: map[ml]?.stock ?? 0 }),
        }).then((r) => r.ok)
      )
    )
      .then((arr) => arr.every(Boolean))
      .catch(() => false);
    setSavingId(null);
    if (!ok) alert("No se pudo guardar el stock de este perfume");
  };

  async function savePerfume(id: string) {
    const p = rows.find((x) => x.id === id);
    if (!p) return;
    setSavingId(id);
    const res = await fetch(`/api/perfumes?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: p.nombre,
        precio: Number.isFinite(p.precio) ? p.precio : 0,
        categoria: p.categoria,
        imagenes: Array.isArray(p.imagenes) ? p.imagenes : [],
        descripcion: p.descripcion ?? "",
      }),
    }).catch(() => null);
    setSavingId(null);
    if (!res || !res.ok) alert("No se pudo guardar");
  }

  const addPhotos = (id: string) => filePickers.current[id]?.click();

  async function onFiles(id: string, brand: string, files: FileList | null) {
    if (!files || !files.length) return;
    const curr = rows.find((p) => p.id === id);
    if (!curr) return;

    const keys: string[] = [];
    try {
      for (const f of Array.from(files)) keys.push(await uploadToS3(f, brand || "misc"));
    } catch {
      alert("Fallo al subir imagen");
      return;
    }
    const newImgs = [...(curr.imagenes ?? []), ...keys];

    // Optimista
    setRows((rs) => rs.map((p) => (p.id === id ? { ...p, imagenes: newImgs } : p)));

    setSavingId(id);
    const ok = await fetch(`/api/perfumes?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagenes: newImgs }),
    })
      .then((r) => r.ok)
      .catch(() => false);
    setSavingId(null);

    if (!ok) {
      alert("No se pudieron guardar las imágenes");
      setRows((rs) => rs.map((p) => (p.id === id ? { ...p, imagenes: curr.imagenes ?? [] } : p)));
    }
    if (filePickers.current[id]) filePickers.current[id]!.value = "";
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar este perfume?")) return;
    const res = await fetch(`/api/perfumes/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res && res.ok) {
      setRows((rs) => rs.filter((p) => p.id !== id));
      setVariants((vs) => {
        const n = { ...vs };
        delete n[id];
        return n;
      });
    } else {
      alert("No se pudo eliminar");
    }
  }

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Admin de Perfumes</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Producto</th>
              <th className="py-2">Precio base</th>
              <th className="py-2">Categoría</th>
              <th className="py-2">Stock 3/5/10 ml</th>
              <th className="py-2">Imágenes</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const vmap = variants[r.id] ?? {};
              return (
                <tr key={r.id} className="border-b align-top">
                  <td className="py-2">
                    <div className="font-medium">
                      {r.marca} {r.nombre}
                    </div>
                    <div className="text-xs text-gray-500">{Number.isFinite(r.ml) ? r.ml : 0} ml (frasco)</div>
                    <textarea
                      value={r.descripcion ?? ""}
                      onChange={(e) => setDescripcion(r.id, e.target.value)}
                      rows={3}
                      placeholder="Descripción"
                      className="mt-2 w-full rounded border px-2 py-1 bg-white text-black"
                    />
                  </td>

                  <td className="py-2">
                    <input
                      type="number"
                      value={Number.isFinite(r.precio) ? r.precio : 0}
                      onChange={(e) => setPrecio(r.id, parseInt(e.target.value || "0", 10))}
                      className="w-32 rounded border px-2 py-1 bg-white text-black"
                    />
                    <div className="text-xs text-gray-500 mt-1">{money(r.precio)}</div>
                  </td>

                  <td className="py-2">
                    <select
                      value={r.categoria ?? "OTROS"}
                      onChange={(e) => setCategoria(r.id, e.target.value as Categoria)}
                      className="rounded border px-2 py-1 bg-white text-black"
                    >
                      {CATS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Variantes */}
                  <td className="py-2">
                    <div className="space-y-2">
                      {ML.map((ml) => (
                        <div key={ml} className="flex items-center gap-2">
                          <span className="w-10 shrink-0">{ml} ml</span>
                          <span className="text-xs text-gray-500 w-20 shrink-0">
                            {money(vmap[ml]?.price ?? 0)}
                          </span>
                          <button
                            onClick={() => setVarStock(r.id, ml, (vmap[ml]?.stock ?? 0) - 1)}
                            className="px-2 py-1 rounded border"
                            aria-label={`-1 ${ml} ml`}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={vmap[ml]?.stock ?? 0}
                            onChange={(e) =>
                              setVarStock(r.id, ml, Math.max(0, parseInt(e.target.value || "0", 10)))
                            }
                            className="w-20 rounded border px-2 py-1 bg-white text-black"
                            aria-label={`Stock ${ml} ml`}
                          />
                          <button
                            onClick={() => setVarStock(r.id, ml, (vmap[ml]?.stock ?? 0) + 1)}
                            className="px-2 py-1 rounded border"
                            aria-label={`+1 ${ml} ml`}
                          >
                            +
                          </button>
                          <button
                            onClick={() => saveVar(r.id, ml)}
                            className="px-3 py-1 rounded bg-blue-600 text-white"
                            disabled={savingId === `${r.id}:${ml}`}
                          >
                            {savingId === `${r.id}:${ml}` ? "..." : "Guardar"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {(r.imagenes ?? []).map((u) => (
                        <div key={u} className="relative h-16 w-16 rounded overflow-hidden border">
                          <Image src={toUrl(u)} alt="img" fill sizes="64px" className="object-cover" />
                        </div>
                      ))}
                    </div>
                    <input
                      ref={setFilePickerRef(r.id)}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => onFiles(r.id, r.marca, e.target.files)}
                    />
                    <button onClick={() => addPhotos(r.id)} className="mt-2 px-3 py-1 rounded border">
                      Agregar fotos
                    </button>
                  </td>

                  <td className="py-2 space-y-2">
                    <button
                      onClick={() => savePerfume(r.id)}
                      className="block w-full px-3 py-1 rounded bg-blue-600 text-white"
                      disabled={savingId === r.id}
                    >
                      {savingId === r.id ? "Guardando..." : "Guardar datos"}
                    </button>

                    <button
                      onClick={() => saveAllVars(r.id)}
                      className="block w-full px-3 py-1 rounded bg-emerald-600 text-white"
                      disabled={savingId === r.id}
                    >
                      {savingId === r.id ? "Guardando..." : "Guardar stock (3/5/10)"}
                    </button>

                    <button
                      onClick={() => del(r.id)}
                      className="block w-full px-3 py-1 rounded border"
                      disabled={savingId === r.id}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
