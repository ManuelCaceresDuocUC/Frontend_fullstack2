// src/components/Footer.tsx
"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 mt-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        {/* columnas */}
        <div className="grid gap-8 md:grid-cols-4">
          {/* Empresa */}
          <section>
            <details className="group" open>
              <summary className="flex cursor-pointer items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide">Empresa</h2>
                <span className="transition group-open:rotate-180">
                  <svg width="22" height="22" viewBox="0 0 24 24" className="opacity-70">
                    <path d="M20 8.5 12.5 16 5 8.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </span>
              </summary>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/pages/terminos-y-condiciones" className="hover:underline">Términos y Condiciones</Link></li>
                <li><Link href="/pages/despachos" className="hover:underline">Despachos</Link></li>
                <li><Link href="/pages/reclamos" className="hover:underline">Reclamos</Link></li>
              </ul>
            </details>
          </section>
          
        </div>

        {/* meta */}
        <hr className="my-8 border-white/10" />
        <div className="grid gap-6 md:grid-cols-2 text-xs">
          <div className="opacity-80">
            © {new Date().getFullYear()} <Link href="/" className="hover:underline">MAfums.cl</Link>. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-3 md:justify-end">
            <span className="sr-only">Formas de pago aceptadas</span>
            <ul className="flex flex-wrap items-center gap-3 opacity-80">
              <li className="rounded bg-white/10 px-2 py-1">Webpay</li>
              <li className="rounded bg-white/10 px-2 py-1">Crédito</li>
              <li className="rounded bg-white/10 px-2 py-1">Débito</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
