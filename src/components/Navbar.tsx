"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
// AGREGAMOS BriefcaseMedical para el icono de farmacia
import { Menu, X, Phone, BriefcaseMedical } from "lucide-react"; 
import { useSession, signOut } from "next-auth/react";
import LogoKuyval from "@/components/LogoKuyval";
// import ShippingMarquee from "@/components/ShippingMarquee"; // Asumo que esto existe en tu proyecto

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

// --- COMPONENTE DEL BOTÓN PALPITANTE ---
function PulsingPharmacyBtn({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link href="/farmacias" className={`${mobile ? "w-full mt-2 flex justify-center" : ""}`}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative group flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-200 font-medium hover:bg-red-100 transition ${mobile ? "w-full justify-center" : ""}`}
      >
        {/* El círculo que palpita detrás del icono */}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        
        <span className="pl-4 flex items-center gap-2">
          <BriefcaseMedical className="h-4 w-4" />
          <span>Farmacias Turno</span>
        </span>
      </motion.div>
    </Link>
  );
}

export default function Navbar() {
  const hdrRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = hdrRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--hdr-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener("resize", set);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);

  const [mDecants, setMDecants] = useState(false);
  const [openDecants, setOpenDecants] = useState(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpenDecants(true);
  };
  const handleLeave = () => {
    closeTimeout.current = setTimeout(() => setOpenDecants(false), 120);
  };

  const goProfile = () => {
    const role = (session?.user as { role?: "ADMIN" | "USER" })?.role ?? "USER";
    router.push(role === "ADMIN" ? "/perfumes/nuevo" : "/perfil");
  };

  const doSignOut = async () => {
    setOpen(false);
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <header ref={hdrRef} className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200 text-slate-900">
      {/* Fila superior */}
      <div className="hidden md:flex justify-end text-slate-500 text-sm pr-4 md:pr-8 pt-2">
        <a href="tel:+56912345678" className="flex items-center gap-2 hover:text-slate-700">
          <Phone className="h-4 w-4" />
          +56 9 96654293
        </a>
      </div>

      {/* Fila principal */}
      <div className="relative mx-auto max-w-7xl px-4 md:px-8 pb-3">
        <div className="mt-3 flex items-center justify-between px-2 py-3">
          <Link href="/" className="flex items-center gap-3" aria-label="Inicio Kuyval">
            <LogoKuyval className="h-8 text-slate-900" />
          </Link>

          {/* Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink href="/">Inicio</NavLink>
            <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
              <MotionLink
                href="/galeria?decants=1"
                className="px-4 py-2 rounded-xl font-medium text-slate-700 hover:text-slate-900"
              >
                Decants
              </MotionLink>

              {openDecants && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 mt-2 w-[720px] rounded-2xl border border-slate-200 bg-white shadow-xl p-6 z-[60]"
                  onMouseEnter={handleEnter}
                  onMouseLeave={handleLeave}
                >
                 {/* ... (Tu contenido del menú Decants se mantiene igual) ... */}
                 <div className="text-center p-4 text-gray-400">Contenido del menú...</div>
                </div>
              )}
            </div>

            <NavLink href="/contact">Contacto</NavLink>

            {/* --- AQUÍ INSERTAMOS EL BOTÓN EN DESKTOP --- */}
            <div className="ml-2">
                <PulsingPharmacyBtn />
            </div>

            {session ? (
              <div className="ml-2 flex items-center gap-3">
                <button onClick={goProfile} className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition text-slate-900">
                  {session.user?.image && <img src={session.user.image} alt="" className="h-6 w-6 rounded-full" />}
                  <span className="text-sm hidden md:inline group-hover:underline">
                    {session.user?.name ?? "Mi perfil"}
                  </span>
                </button>
                <button onClick={doSignOut} className="px-3 py-2 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition text-slate-900">
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
          <button onClick={() => setOpen(v => !v)} className="md:hidden rounded-xl border border-slate-300 p-2 text-slate-900">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Móvil */}
        {open && (
          <div className="mt-2 md:hidden rounded-2xl border border-slate-200 bg-white text-slate-900">
            <div className="flex flex-col p-3">
              {/* ... (Tu lógica de acordeón Decants se mantiene igual) ... */}
              
              <NavLink href="/">Inicio</NavLink>
              <NavLink href="/contact">Contacto</NavLink>

              {/* --- AQUÍ INSERTAMOS EL BOTÓN EN MÓVIL --- */}
              <PulsingPharmacyBtn mobile />

              <div className="my-2 border-t border-slate-100"></div>

              {session ? (
                <>
                  <button onClick={() => { setOpen(false); goProfile(); }} className="px-3 py-2 rounded-xl hover:bg-slate-100 text-left">
                    {session.user?.name ?? "Mi perfil"}
                  </button>
                  <button onClick={doSignOut} className="mt-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200">
                    Salir
                  </button>
                </>
              ) : (
                <Link href="/inicio-sesion" onClick={() => setOpen(false)} className="mt-2 px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 text-center">
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