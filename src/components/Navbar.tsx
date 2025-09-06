"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Car, Menu, X, Phone } from "lucide-react";
import MegaMenuAutos from "@/components/MegaMenuAutos";
import { useSession, signOut } from "next-auth/react";

const MotionLink = motion.create(Link);

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <MotionLink
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`px-4 py-2 rounded-xl font-medium border transition text-white ${
        active ? "bg-white/20 border-white/30" : "border-transparent hover:bg-white/10"
      }`}
    >
      {children}
    </MotionLink>
  );
}

export default function Navbar() {
  const { data: session } = useSession(); // ✅ aquí adentro
  const [open, setOpen] = useState(false);
  const [hoverAutos, setHoverAutos] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAutos = () => {
    if (timer.current) clearTimeout(timer.current);
    setHoverAutos(true);
  };
  const hideAutos = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHoverAutos(false), 120);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/10 backdrop-blur border-b border-white/15">
      <div className="hidden md:flex justify-end text-white/80 text-sm pr-4 md:pr-8 pt-2">
        <a href="tel:+56912345678" className="flex items-center gap-2 hover:text-white">
          <Phone className="h-4 w-4" />
          +56 9 1234 5678
        </a>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8 pb-3">
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white">
          <Link href="/" className="flex items-center gap-2 text-xl md:text-2xl font-extrabold">
            <Car className="h-6 w-6 text-yellow-400" />
            Tuvolante<span className="text-yellow-400">.cl</span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <div
              onMouseEnter={showAutos}
              onMouseLeave={hideAutos}
              onFocus={showAutos}
              onBlur={hideAutos}
              className="relative"
            >
             
            </div>

            <NavLink href="/financiamiento">Financiamiento</NavLink>
            <NavLink href="/galeria">Vehículos</NavLink>
            <NavLink href="/contact">Contacto</NavLink>

            {session ? (
  <div className="ml-2 flex items-center gap-3">
    <Link
      href="/perfil"
      className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 hover:bg-white/10 transition"
    >
          {session.user?.image && (
            <img src={session.user.image} alt="" className="h-6 w-6 rounded-full" />
          )}
          <span className="text-sm hidden md:inline group-hover:underline">
            {session.user?.name ?? "Mi perfil"}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-3 py-2 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 transition"
        >
          Salir
        </button>
      </div>
    ) : (
      <MotionLink
        href="/inicio-sesion"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="ml-2 bg-yellow-400 text-black px-5 py-2.5 rounded-2xl font-semibold shadow-lg hover:bg-yellow-300 transition"
      >
        Iniciar sesión
      </MotionLink>
    )}
          </nav>

          <button
            aria-label="Abrir menú"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden rounded-xl border border-white/30 p-2 text-white"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <MegaMenuAutos open={hoverAutos} onEnter={showAutos} onLeave={hideAutos} />

        {open && (
          <div className="mt-2 md:hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur text-white">
            <div className="flex flex-col p-3">
              
             
              <Link href="/financiamiento" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl hover:bg-white/10">
                Financiamiento
              </Link>
              <Link href="/galeria" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl hover:bg-white/10">
                vehículos
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl hover:bg-white/10">
                Contacto
              </Link>

              {session ? (
  <>
    <Link
      href="/perfil"
      onClick={() => setOpen(false)}
      className="px-3 py-2 rounded-xl hover:bg-white/10"
    >
      {session.user?.name ?? "Mi perfil"}
    </Link>

    <button
      type="button"
      onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
      className="mt-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20"
    >
      Salir
    </button>
  </>
) : (
  <Link
    href="/inicio-sesion"
    onClick={() => setOpen(false)}
    className="mt-2 px-3 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
  >
    Iniciar Sesión
  </Link>
)}

            </div>
          </div>
        )}
      </div>
    </header>
  );
}
