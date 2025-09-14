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

          {/* Tiendas */}
          <section className="md:col-span-1">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-4">Tiendas</h2>
            <div className="text-sm leading-6">
              <p className="opacity-80">Autorizadas para Retiros y Venta Mayorista:</p>
              <p className="mt-3">
                <span className="underline font-semibold">Santiago</span><br />
                Av. Salvador Sanfuentes 2608 — Metro ULA
              </p>
              <p className="mt-3">
                <span className="underline font-semibold">Providencia</span><br />
                Av. Providencia 2237, Local P-24G (C.C. Dos Providencia) — Metro Los Leones
              </p>
            </div>
          </section>

          {/* Mayoristas */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide mb-4">
              Ventas mayoristas desde $1.000.000
            </h2>
            <div className="text-sm leading-6">
              <p>Contacta a nuestros ejecutivos de venta mayorista.</p>
              <p className="mt-2"><span className="font-semibold">Fono:</span> +56 9 8163 7953</p>
              <p><span className="font-semibold">Correo:</span> ventas@mafums.cl</p>
            </div>
          </section>

          {/* Newsletter */}
          <section>
            <details className="group" open>
              <summary className="flex cursor-pointer items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide">
                  ¿Quieres recibir más ofertas?
                </h2>
                <span className="transition group-open:rotate-180">
                  <svg width="22" height="22" viewBox="0 0 24 24" className="opacity-70">
                    <path d="M20 8.5 12.5 16 5 8.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-sm opacity-80">Suscríbete a nuestro newsletter</p>
              <form
                onSubmit={(e) => { e.preventDefault(); alert("Gracias por suscribirte."); }}
                className="mt-3 flex gap-2"
              >
                <label htmlFor="footer-email" className="sr-only">Correo electrónico</label>
                <input
                  id="footer-email"
                  type="email"
                  required
                  placeholder="Tu correo"
                  autoComplete="email"
                  className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  Suscribirme
                </button>
              </form>
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
              <li className="rounded bg-white/10 px-2 py-1">Transferencia</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
