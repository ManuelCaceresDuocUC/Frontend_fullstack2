"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Col = { title: string; items: { label: string; href: string }[] };

const COLS: Col[] = [
  { title: "Por tipo", items: [
    { label: "SUV", href: "/galeria?tipo=suv" },
    { label: "Sedán", href: "/galeria?tipo=sedan" },
    { label: "Hatchback", href: "/galeria?tipo=hatchback" },
    { label: "Pickup", href: "/galeria?tipo=pickup" },
    { label: "4x4", href: "/galeria?tipo=4x4" },
    { label: "Motocicleta", href: "/galeria?tipo=motocicleta" },
  ]},
  { title: "Combustible", items: [
    { label: "Gasolina", href: "/galeria?combustible=gasolina" },
    { label: "Diésel", href: "/galeria?combustible=diesel" },
    { label: "Híbrido", href: "/galeria?combustible=hibrido" },
    { label: "Eléctrico", href: "/galeria?combustible=electrico" },
  ]},
  { title: "Transmisión", items: [
    { label: "Manual", href: "/galeria?transmision=manual" },
    { label: "Automática", href: "/galeria?transmision=automatica" },
    { label: "CVT", href: "/galeria?transmision=cvt" },
  ]},
  { title: "Presupuesto", items: [
    { label: "Menos de $5M", href: "/galeria?priceMax=5000000" },
    { label: "$5M – $10M", href: "/galeria?priceMin=5000000&priceMax=10000000" },
    { label: "$10M – $20M", href: "/galeria?priceMin=10000000&priceMax=20000000" },
    { label: "Sobre $20M", href: "/galeria?priceMin=20000000" },
  ]},
  { title: "Cilindrada", items: [
    { label: "150cc – 300cc", href: "/galeria?ccMin=150&ccMax=300" },
    { label: "300cc – 600cc", href: "/galeria?ccMin=300&ccMax=600" },
    { label: "600cc – 1000cc", href: "/galeria?ccMin=600&ccMax=1000" },
    { label: "Sobre 1000cc", href: "/galeria?ccMin=1000" },
  ]},
];


export default function MegaMenuAutos({
  open, onEnter, onLeave,
}: {
  open: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 right-0 top-full z-50 hidden md:block"
        >
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mt-3 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
              <div className="grid gap-8 md:grid-cols-4">
                {COLS.map((col) => (
                  <div key={col.title}>
                    <h4 className="mb-3 text-sm font-semibold text-slate-700">
                      {col.title.toUpperCase()}
                    </h4>
                    <ul className="list-none space-y-2 p-0 m-0">
                      {col.items.map((it) => (
                        <li key={it.label}>
                          <Link
                            href={it.href}
                            className="block text-slate-700 hover:text-slate-900 hover:underline"
                          >
                            {it.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
