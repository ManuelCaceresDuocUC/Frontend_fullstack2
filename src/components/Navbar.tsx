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
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [hoverAutos, setHoverAutos] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAutos = () => { if (timer.current) clearTimeout(timer.current); setHoverAutos(true); };
  const hideAutos = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHoverAutos(false), 120);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="hidden md:flex justify-end text-slate-500 text-sm pr-4 md:pr-8 pt-2">
        <a href="tel:+56912345678" className="flex items-center gap-2 hover:text-slate-700">
          <Phone className="h-4 w-4" />
          +56 9 1234 5678
        </a>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8 pb-3">
        <div className="mt-3 flex items-center justify-between px-2 py-3">
          <Link href="/" className="flex items-center gap-2 text-xl md:text-2xl font-extrabold">
            <a className="h-6 w-6 text-blue-600" />
            MAfums<span className="text-blue-600">.cl</span>
          </Link>

          {/* Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            <div
              onMouseEnter={showAutos}
              onMouseLeave={hideAutos}
              onFocus={showAutos}
              onBlur={hideAutos}
              className="relative"
            />
            <NavLink href="/galeria?tipos=DISEÑADOR&priceMin=19990&priceMax=300000">Perfumes Diseñador</NavLink>
            <NavLink href="/galeria?tipos=ARABES&priceMin=19990&priceMax=300000">Perfumes Árabes</NavLink>
            <NavLink href="/contact">Contacto</NavLink>

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
            onClick={() => setOpen((v) => !v)}
            className="md:hidden rounded-xl border border-slate-300 p-2 text-slate-900"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <MegaMenuAutos open={hoverAutos} onEnter={showAutos} onLeave={hideAutos} />

        {/* Móvil */}
        {open && (
          <div className="mt-2 md:hidden rounded-2xl border border-slate-200 bg-white text-slate-900">
            <div className="flex flex-col p-3">
              <NavLink
                href="/galeria?tipos=DISEÑADOR&priceMin=19990&priceMax=300000"
              >
                Perfumes Diseñador
              </NavLink>
              <NavLink
                href="/galeria?tipos=ARABES&priceMin=19990&priceMax=300000"
              >
                Perfumes Árabes
              </NavLink>
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
