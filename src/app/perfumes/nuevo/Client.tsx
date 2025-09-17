// app/perfumes/nuevo/Client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getJSON } from "@/lib/http";

const S3_BASE = (process.env.NEXT_PUBLIC_S3_BASE ?? "").replace(/\/+$/, "");
const toUrl = (key: string) => (S3_BASE ? `${S3_BASE}/${key.replace(/^\/+/, "")}` : key);

// Categorías
const CATS = ["NICHO", "ARABES", "DISEÑADOR", "OTROS"] as const;
type Categoria = (typeof CATS)[number];
const isCategoria = (x: unknown): x is Categoria =>
  CATS.includes(String(x) as Categoria);

// Género
const GENEROS = ["HOMBRE", "MUJER", "UNISEX"] as const;
type Genero = (typeof GENEROS)[number];
const isGenero = (x: unknown): x is Genero =>
  GENEROS.includes(String(x).toUpperCase() as Genero);

// Upload S3
async function uploadToS3(file: File, brand: string): Promise<{ key: string }> {
  const q = new URLSearchParams({ filename: file.name, type: file.type, brand });
  const { signedUrl, key } = await getJSON<{ signedUrl: string; key: string }>(`/api/s3/presign?${q}`);
  const put = await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!put.ok) throw new Error("S3 upload failed");
  return { key };
}

export default function Client() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState("");
  const [keys, setKeys] = useState<string[]>([]);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setLoading(true);
    try {
      const uploaded: string[] = [];
      for (const f of files) {
        const { key } = await uploadToS3(f, brand || "misc");
        uploaded.push(key);
      }
      setKeys((prev) => [...prev, ...uploaded]);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const rawCat = fd.get("categoria");
    const categoria: Categoria = isCategoria(rawCat) ? (String(rawCat) as Categoria) : "OTROS";

    const rawGenero = fd.get("genero");
    const genero: Genero = isGenero(rawGenero) ? (String(rawGenero).toUpperCase() as Genero) : "UNISEX";

    const body = {
      nombre: String(fd.get("nombre") ?? "").trim(),
      marca: String(fd.get("marca") ?? "").trim(),
      ml: Number(fd.get("ml")),
      precio: Number(fd.get("precio")),
      categoria,
      genero,
      descripcion: String(fd.get("descripcion") ?? "").trim(),
      imagenes: keys,
    };

    setLoading(true);
    const res = await fetch("/api/perfumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (res.ok) router.push("/galeria");
    else alert("Error al publicar");
  }

  const money = (n: number) =>
    (Number.isFinite(n) ? n : 0).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-16 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      <div className="max-w-2xl mx-auto rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold">Publicar perfume</h1>
          <Link href="/perfumes/admin" className="px-4 py-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20">
            Ir a admin
          </Link>
          <Link href="/admin/pedidos" className="px-4 py-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20">
            Ir a pedidos
          </Link>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <input name="nombre" required placeholder="Nombre" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
            <input name="marca" required placeholder="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
            <input name="ml" type="number" min={1} required placeholder="ML" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
            <input name="precio" type="number" min={0} required placeholder="Precio (CLP)" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select name="categoria" defaultValue="OTROS" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
              {CATS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select name="genero" defaultValue="UNISEX" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
              {GENEROS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <textarea
              name="descripcion"
              rows={4}
              placeholder="Descripción del perfume (notas, uso, estacionalidad)"
              className="col-span-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/60"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Imágenes (S3)</label>
            <input type="file" accept="image/*" multiple onChange={onFiles} className="block w-full text-white" />
            {keys.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {keys.map((k) => (
                  <div key={k} className="relative h-24 w-full overflow-hidden rounded-lg border border-white/20">
                    <Image src={toUrl(k)} alt="preview" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button disabled={loading} className="bg-amber-300 text-black py-3 rounded-2xl font-semibold hover:bg-yellow-300 disabled:opacity-60">
            {loading ? "Publicando…" : "Publicar"}
          </button>

          <div className="text-xs text-white/70">
            Previsualización precio: <span>{money(Number((document.querySelector('input[name="precio"]') as HTMLInputElement)?.value) || 0)}</span>
          </div>
        </form>
      </div>
    </main>
  );
}
