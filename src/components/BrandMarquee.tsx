"use client";
import { motion } from "framer-motion";

const brands = [
  { src: "/brands/ajmal-perfumes-seeklogo.png", alt: "Ajmal" },
  { src: "/brands/al-haramain-seeklogo.svg", alt: "Al-haramain" },
  { src: "/brands/lattafa-logo.svg", alt: "Lattafa" },
];

const REPEAT = 6; // súbelo si aún ves huecos

const seq = Array.from({ length: REPEAT }).flatMap(() => brands);

export default function BrandMarquee() {
  return (
    <div className="w-full overflow-hidden bg-white border-y border-slate-200">
      <motion.div
        className="flex items-center gap-10 py-6 min-w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        {/* bloque A */}
        {seq.map((b, i) => (
          <img key={`a-${i}-${b.alt}`} src={b.src} alt={b.alt} title={b.alt} className="h-8 md:h-10 w-auto opacity-80 hover:opacity-100 transition" />
        ))}
        {/* bloque B idéntico para loop continuo */}
        {seq.map((b, i) => (
          <img aria-hidden key={`b-${i}-${b.alt}`} src={b.src} alt="" className="h-8 md:h-10 w-auto opacity-80 transition" />
        ))}
      </motion.div>
    </div>
  );
}
