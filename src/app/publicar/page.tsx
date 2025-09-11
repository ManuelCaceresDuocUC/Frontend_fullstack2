"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublicarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch("/api/vehiculos", { method: "POST", body: fd });
    setLoading(false);
    if (res.ok) router.push("/galeria");
    else alert("Error al publicar");
  };

  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-16 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      <div className="max-w-2xl mx-auto rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6">
        <h1 className="text-3xl font-extrabold mb-4">Publicar vehículo</h1>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <input name="marca" required placeholder="Marca" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
            <input name="modelo" required placeholder="Modelo" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
            <input name="anio" type="number" required placeholder="Año" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
            <input name="precio" type="number" required placeholder="Precio (CLP)" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
            <input name="tipo" required placeholder="Tipo (suv, sedan...)" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
            <input name="combustible" required placeholder="Combustible" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
            <input name="transmision" required placeholder="Transmisión" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm mb-1">Imágenes (múltiples)</label>
            <input name="imagenes" type="file" accept="image/*" multiple className="block w-full text-white" />
            <p className="text-xs text-white/70 mt-1">Se guardan en <code>/public/gallery</code>.</p>
          </div>

          <button disabled={loading} className="bg-amber-300 text-black py-3 rounded-2xl font-semibold hover:bg-yellow-300 disabled:opacity-60">
            {loading ? "Publicando…" : "Publicar"}
          </button>
        </form>
      </div>
    </main>
  );
}
