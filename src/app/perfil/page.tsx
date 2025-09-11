"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import VehicleCard, { Vehiculo } from "@/components/VehicleCard";

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const [mine, setMine] = useState<Vehiculo[]>([]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/vehiculos?mine=1").then(r => r.json()).then(setMine);
    }
  }, [status]);

  if (status === "loading") return <main className="pt-28 md:pt-36 px-4 py-16 text-white">Cargando…</main>;
  if (!session) return <main className="pt-28 md:pt-36 px-4 py-16 text-white">Debes iniciar sesión.</main>;

  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-16 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          {session.user?.image && <img src={session.user.image} className="h-10 w-10 rounded-full" alt="" />}
          <div>
            <h1 className="text-3xl font-extrabold">{session.user?.name}</h1>
            <p className="text-white/80">{session.user?.email}</p>
          </div>
        </div>

        <a href="/publicar" className="inline-block mb-6 bg-amber-300 text-black px-5 py-2.5 rounded-2xl font-semibold hover:bg-yellow-300">
          Publicar un vehículo
        </a>

        {mine.length === 0 ? (
          <p className="text-white/80">Aún no publicas vehículos.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map(v => <VehicleCard key={v.id} v={v} />)}
          </div>
        )}
      </div>
    </main>
  );
}
