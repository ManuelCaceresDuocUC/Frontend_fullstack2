"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function RegistroPage() {
  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6 shadow-2xl">
        <h1 className="text-3xl font-extrabold mb-1">Crear cuenta</h1>
        <p className="text-white/80 mb-6">Rellena tus datos.</p>

        <form className="space-y-4" onSubmit={(e)=>e.preventDefault()}>
          <input className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 placeholder-white/60 outline-none"
                 placeholder="Nombre" required />
          <input type="email" className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 placeholder-white/60 outline-none"
                 placeholder="Correo" required />
          <input type="password" className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 placeholder-white/60 outline-none"
                 placeholder="Contraseña" required />
          <button className="w-full bg-yellow-400 text-black py-3 rounded-2xl font-semibold hover:bg-yellow-300 transition">
            Registrarme
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/80">
          ¿Ya tienes cuenta? <Link href="/inicio-sesion" className="underline hover:text-white">Inicia sesión</Link>
        </p>
      </motion.div>
    </main>
  );
}
