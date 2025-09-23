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
        </div>    
      </motion.div>
    </main>
  );
}
