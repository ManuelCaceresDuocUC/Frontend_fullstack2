// app/perfil/page.tsx
"use client";
import { useSession } from "next-auth/react";

export default function PerfilPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <main className="pt-28 md:pt-36 px-4 py-16">Cargando…</main>;
  if (!session) return <main className="pt-28 md:pt-36 px-4 py-16">Debes iniciar sesión.</main>;

  const u = session.user;

  
  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-16 bg-gradient-to-b from-fuchsia-600 to-violet-800 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          {u.image && <img src={u.image} className="h-12 w-12 rounded-full" alt="" />}
          <div>
            <h1 className="text-3xl font-extrabold">{u.name}</h1>
            <p className="text-white/80">{u.email}</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Tu actividad</h2>
          <ul className="list-disc pl-6 text-white/90">
            <li>Aún no tienes pedidos registrados.</li>
            <li>Puedes explorar la <a href="/galeria" className="underline">galería</a> y agregar perfumes al carrito.</li>
          </ul>
        </section>
  

  
        {u.role === "ADMIN" && (
          <div className="mt-8">
            <a href="/perfumes/nuevo" className="inline-block bg-amber-300 text-black px-5 py-2.5 rounded-2xl font-semibold hover:bg-yellow-300">
              Ingresar perfume nuevo
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
