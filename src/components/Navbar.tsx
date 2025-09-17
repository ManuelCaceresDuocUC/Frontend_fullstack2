"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {  Menu, X, Phone } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import LogoKuyval from "@/components/LogoKuyval";

const MotionLink = motion.create(Link);

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <MotionLink
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      aria-current={active ? "page" : undefined}
      className={`px-4 py-2 rounded-xl font-medium transition ${
        active ? "text-blue-600" : "text-slate-700 hover:text-slate-900"
      }`}
    >
      {children}
    </MotionLink>
  );
}

export default function Navbar() {
  const [mDecants, setMDecants] = useState(false); // móvil
  const [openDecants, setOpenDecants] = useState(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [hoverAutos, setHoverAutos] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAutos = () => { if (timer.current) clearTimeout(timer.current); setHoverAutos(true); };
  const hideAutos = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHoverAutos(false), 120);
  };

  const handleEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpenDecants(true);
  };

  const handleLeave = () => {
    closeTimeout.current = setTimeout(() => setOpenDecants(false), 120);
  };

  return (
  <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200 text-slate-900">
    {/* Barra superior */}
    <div className="hidden md:flex justify-end text-slate-500 text-sm pr-4 md:pr-8 pt-2">
      <a href="tel:+56912345678" className="flex items-center gap-2 hover:text-slate-700">
        <Phone className="h-4 w-4" />
        +56 9 1234 5678
      </a>
    </div>

    <div className="relative mx-auto max-w-7xl px-4 md:px-8 pb-3">
      <div className="mt-3 flex items-center justify-between px-2 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3" aria-label="Inicio Kuyval">
          {/* si no usas el componente, reemplaza por texto */}
          <LogoKuyval className="h-8 text-slate-900" />
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-2">
{/* Mega menú Decants */}
<div
  className="relative"
  onMouseEnter={handleEnter}
  onMouseLeave={handleLeave}
>
  <button
    type="button"
    className="px-4 py-2 rounded-xl font-medium text-slate-700 hover:text-slate-900"
    aria-haspopup="true"
    aria-expanded={openDecants}
  >
    Decants
  </button>

  {openDecants && (
    <div
      className="absolute left-1/2 -translate-x-1/2 mt-2 w-[720px] rounded-2xl border border-slate-200 bg-white shadow-xl p-6"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Hombre */}
        <div>
          <div className="text-xs font-semibold tracking-wider text-slate-500 mb-2">HOMBRE</div>
          <ul className="space-y-2">
            <li><Link href="/galeria?genero=HOMBRE&tipos=ARABES&decants=1" className="hover:underline">Árabes</Link></li>
            <li><Link href="/galeria?genero=HOMBRE&tipos=DISEÑADOR&decants=1" className="hover:underline">Diseñador</Link></li>
            <li><Link href="/galeria?genero=HOMBRE&tipos=NICHO&decants=1" className="hover:underline">Nicho</Link></li>
          </ul>
        </div>
        {/* Mujer */}
        <div>
          <div className="text-xs font-semibold tracking-wider text-slate-500 mb-2">MUJER</div>
          <ul className="space-y-2">
            <li><Link href="/galeria?genero=MUJER&tipos=ARABES&decants=1" className="hover:underline">Árabes</Link></li>
            <li><Link href="/galeria?genero=MUJER&tipos=DISEÑADOR&decants=1" className="hover:underline">Diseñador</Link></li>
            <li><Link href="/galeria?genero=MUJER&tipos=NICHO&decants=1" className="hover:underline">Nicho</Link></li>
          </ul>
        </div>
        {/* Unisex */}
        <div>
          <div className="text-xs font-semibold tracking-wider text-slate-500 mb-2">UNISEX</div>
          <ul className="space-y-2">
            <li><Link href="/galeria?genero=UNISEX&tipos=ARABES&decants=1" className="hover:underline">Árabes</Link></li>
            <li><Link href="/galeria?genero=UNISEX&tipos=DISEÑADOR&decants=1" className="hover:underline">Diseñador</Link></li>
            <li><Link href="/galeria?genero=UNISEX&tipos=NICHO&decants=1" className="hover:underline">Nicho</Link></li>
          </ul>
        </div>
      </div>
      <div className="mt-4 text-right">
        <Link href="/galeria?decants=1" className="text-sm text-blue-600 hover:underline">
          Ver todo Decants →
        </Link>
      </div>
    </div>
  )}
</div>
          {/* Enlaces existentes */}
          <NavLink href="/">Inicio</NavLink>
          <NavLink href="/galeria?tipos=DISEÑADOR&priceMin=19990&priceMax=300000">Perfumes Diseñador</NavLink>
          <NavLink href="/galeria?tipos=ARABES&priceMin=19990&priceMax=300000">Perfumes Árabes</NavLink>
          <NavLink href="/galeria">Nuestros perfumes</NavLink>
          <NavLink href="/contact">Contacto</NavLink>

          {/* Sesión */}
          {session ? (
            <div className="ml-2 flex items-center gap-3">
              <Link
                href="/perfumes/nuevo"
                className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition text-slate-900"
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
                className="px-3 py-2 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition text-slate-900"
              >
                Salir
              </button>
            </div>
          ) : (
            <MotionLink
              href="/inicio-sesion"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ml-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-semibold shadow-sm hover:bg-blue-700 transition"
            >
              Iniciar sesión
            </MotionLink>
          )}
        </nav>

        {/* Toggle móvil */}
        <button
          aria-label="Abrir menú"
          onClick={() => setOpen(v => !v)}
          className="md:hidden rounded-xl border border-slate-300 p-2 text-slate-900"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Móvil */}
      {open && (
        <div className="mt-2 md:hidden rounded-2xl border border-slate-200 bg-white text-slate-900">
          <div className="flex flex-col p-3">
            {/* Acordeón Decants */}
            <button
              onClick={() => setMDecants(v => !v)}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100"
              aria-expanded={mDecants}
            >
              <span>Decants</span>
              <span className="text-slate-500">{mDecants ? "−" : "+"}</span>
            </button>
            {mDecants && (
              <div className="pl-3 pb-2">
                <div className="text-xs font-semibold text-slate-500 mt-2">HOMBRE</div>
                <div className="flex flex-col">
                  <Link href="/galeria?genero=HOMBRE&tipos=ARABES&decants=1" className="py-1 px-2 rounded hover:bg-slate-100">Árabes</Link>
                  <Link href="/galeria?genero=HOMBRE&tipos=DISEÑADOR&decants=1" className="py-1 px-2 rounded hover:bg-slate-100">Diseñador</Link>
                  <Link href="/galeria?genero=HOMBRE&tipos=NICHO&decants=1" className="py-1 px-2 rounded hover:bg-slate-100">Nicho</Link>
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-3">MUJER</div>
                <div className="flex flex-col">
                  <Link href="/galeria?genero=MUJER&tipos=ARABES&decants=1" className="py-1 px-2 rounded hover:bg-slate-100">Árabes</Link>
                  <Link href="/galeria?genero=MUJER&tipos=DISEÑADOR&decants=1" className="py-1 px-2 rounded hover:bg-slate-100">Diseñador</Link>
                  <Link href="/galeria?genero=MUJER&tipos=NICHO&decants=1" className="py-1 px-2 rounded hover:bg-slate-100">Nicho</Link>
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-3">UNISEX</div>
                <div className="flex flex-col">
                  <Link href="/galeria?genero=UNISEX&tipos=ARABES&decants=1" className="py-1 px-2 rounded hover:bg-slate-100">Árabes</Link>
                  <Link href="/galeria?genero=UNISEX&tipos=DISEÑADOR&decants=1" className="py-1 px-2 rounded hover:bg-slate-100">Diseñador</Link>
                  <Link href="/galeria?genero=UNISEX&tipos=NICHO&decants=1" className="py-1 px-2 rounded hover:bg-slate-100">Nicho</Link>
                </div>
                <Link href="/galeria?decants=1" className="block mt-3 text-sm text-blue-600 px-2">Ver todo Decants →</Link>
              </div>
            )}

            {/* Resto de enlaces */}
            <NavLink href="/">Inicio</NavLink>
            <NavLink href="/galeria?tipos=DISEÑADOR&priceMin=19990&priceMax=300000">Perfumes Diseñador</NavLink>
            <NavLink href="/galeria?tipos=ARABES&priceMin=19990&priceMax=300000">Perfumes Árabes</NavLink>
            <NavLink href="/galeria">Nuestros perfumes</NavLink>
            <NavLink href="/contact">Contacto</NavLink>

            {session ? (
              <>
                <Link
                  href="/perfumes/nuevo"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-xl hover:bg-slate-100"
                >
                  {session.user?.name ?? "Mi perfil"}
                </Link>
                <button
                  type="button"
                  onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="mt-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                href="/inicio-sesion"
                onClick={() => setOpen(false)}
                className="mt-2 px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
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