"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [show, setShow] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: envía a tu API / NextAuth signIn("credentials", { email, password })
  };

  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-6 shadow-2xl"
      >
        <h1 className="text-3xl font-extrabold mb-1">Iniciar sesión</h1>
        <p className="text-white/80 mb-6">Ingresa con tu cuenta o usa un proveedor.</p>

        {/* Social */}
        <div className="grid gap-3 mb-6">
          {/* Si usas NextAuth, estos href apuntan a /api/auth/signin/PROVIDER */}
<button
  onClick={() => signIn("google", { callbackUrl: "/" })}
  className="w-full rounded-2xl border border-white/30 bg-white/10 py-3 hover:bg-white/20 transition"
>            Continuar con Google
</button>
          <a href="/api/auth/signin/github" className="inline-flex justify-center items-center w-full rounded-2xl border border-white/30 bg-white/10 py-3 hover:bg-white/20 transition">
            Continuar con GitHub
          </a>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-white/60 text-sm">o con correo</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-white/85">Correo</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3">
              <Mail className="h-5 w-5 text-white/70" />
              <input
                type="email"
                required
                placeholder="tucorreo@dominio.com"
                className="w-full bg-transparent py-3 outline-none placeholder-white/50"
                name="email"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-white/85">Contraseña</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3">
              <Lock className="h-5 w-5 text-white/70" />
              <input
                type={show ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full bg-transparent py-3 outline-none placeholder-white/50"
                name="password"
              />
              <button type="button" onClick={() => setShow((v) => !v)} className="p-2 text-white/70 hover:text-white">
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="accent-yellow-400" /> Recuérdame
            </label>
            <Link href="/recuperar" className="underline hover:text-white">Olvidé mi contraseña</Link>
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-400 text-black py-3 rounded-2xl font-semibold hover:bg-yellow-300 transition"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/80">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="underline hover:text-white">
            Regístrate
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
