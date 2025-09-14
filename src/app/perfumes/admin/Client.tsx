"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getJSON } from "@/lib/http";
type Categoria = "NICHO" | "ARABES" | "DISEÑADOR" | "OTROS";
type Row = {
  id: string;
  nombre: string;
  marca: string;
  ml: number;
  precio: number;
  imagenes: string[];
  categoria: Categoria;
  qty: number;
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
};
const CATS = ["NICHO", "ARABES", "DISEÑADOR", "OTROS"] as const;
const S3_BASE = (process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const toUrl = (key: string) => (S3_BASE ? `${S3_BASE}/${key.replace(/^\/+/, "")}` : key);

async function uploadToS3(file: File, brand: string): Promise<string> {
  const q = new URLSearchParams({ filename: file.name, type: file.type, brand });
const { signedUrl, key } = await getJSON<{ signedUrl:string; key:string }>(`/api/s3/presign?${q}`);
  const put = await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!put.ok) throw new Error("S3 upload failed");
  return key;
}

export default function Client({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [savingId, setSavingId] = useState<string | null>(null);
  const filePickers = useRef<Record<string, HTMLInputElement | null>>({});

  // Refresco inicial desde API y normalización para evitar inputs no controlados
    useEffect(() => {
    fetch("/api/perfumes")
      .then((r) => r.json() as Promise<unknown>)
      .then((raw) => {
        const arr = Array.isArray(raw) ? (raw as unknown[]) : [];
        const norm: Row[] = arr.map((dRaw) => {
          const d = dRaw as Partial<ApiPerfumeDTO>;
          const imgs =
            Array.isArray(d.imagenes) ? d.imagenes.filter((x): x is string => typeof x === "string") : [];
          return {
            id: String(d.id ?? ""),
            nombre: String(d.nombre ?? ""),
            marca: String(d.marca ?? ""),
            ml: Number.isFinite(Number(d.ml)) ? Number(d.ml) : 0,
            precio: Number.isFinite(Number(d.precio)) ? Number(d.precio) : 0,
            imagenes: imgs,
            categoria: (d.categoria as Categoria) ?? "OTROS",
            qty: Number.isFinite(Number(d.stock)) ? Number(d.stock) : 0,
          };
        });
        setRows(norm);
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

  const setQty = (id: string, qty: number) =>
    setRows((rs) => rs.map((p) => (p.id === id ? { ...p, qty: Math.max(0, qty | 0) } : p)));

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
      }),
    }).catch(() => null);
    setSavingId(null);
    if (!res || !res.ok) alert("No se pudo guardar");
  }

  async function saveStock(id: string) {
    const p = rows.find((x) => x.id === id);
    if (!p) return;
    setSavingId(id);
    const ok = await fetch(`/api/stock/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty: Number.isFinite(p.qty) ? p.qty : 0 }),
    })
      .then((r) => r.ok)
      .catch(() => false);
    setSavingId(null);
    if (!ok) alert("No se pudo guardar el stock");
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

  if (res && res.ok) setRows(rs => rs.filter(p => p.id !== id));
  else alert("No se pudo eliminar");
}

  const money = (n: number) =>
    (Number.isFinite(n) ? n : 0).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Admin de Perfumes</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Producto</th>
              <th className="py-2">Precio</th>
              <th className="py-2">Categoría</th>
              <th className="py-2">Stock</th>
              <th className="py-2">Imágenes</th>
              <th className="py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b align-top">
                <td className="py-2">
                  <div className="font-medium">{r.marca} {r.nombre}</div>
                  <div className="text-xs text-gray-500">{Number.isFinite(r.ml) ? r.ml : 0} ml</div>
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
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>

                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(r.id, (r.qty || 0) - 1)} className="px-2 py-1 rounded border">-</button>
                    <input
                      type="number"
                      min={0}
                      value={Number.isFinite(r.qty) ? r.qty : 0}
                      onChange={(e) => setQty(r.id, parseInt(e.target.value || "0", 10))}
                      className="w-20 rounded border px-2 py-1 bg-white text-black"
                    />
                    <button onClick={() => setQty(r.id, (r.qty || 0) + 1)} className="px-2 py-1 rounded border">+</button>
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
                    onClick={() => saveStock(r.id)}
                    className="block w-full px-3 py-1 rounded bg-emerald-600 text-white"
                    disabled={savingId === r.id}
                  >
                    {savingId === r.id ? "Guardando..." : "Guardar stock"}
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
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
