"use client";
import { motion } from "framer-motion";

const brands = [
  { src: "/brands/ajmal-perfumes-seeklogo.png", alt: "Ajmal" },
  { src: "/brands/al-haramain-seeklogo.svg", alt: "Al-haramain" },
  { src: "/brands/lattafa-logo.svg", alt: "Lattafa" },
  {src: "/brands/Dior_Logo.svg", alt: "Dior" },
  {src: "/brands/giorgio-armani.svg", alt: "Giorgio" },
  {src: "/brands/Valentino_logo.svg", alt: "Valentino" },
  {src: "/brands/Jean_Paul_Gaultier_logo.svg", alt: "Jean_Paul_Gaultier_logo" },
];

const REPEAT = 6; // súbelo si aún ves huecos

const seq = Array.from({ length: REPEAT }).flatMap(() => brands);

export default function BrandMarquee() {
  return (
    <div className="w-full overflow-hidden bg-white border-y border-slate-200">
      <motion.div
        className="flex items-center gap-10 py-6 min-w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        {/* bloque A */}
        {seq.map((b, i) => (
          <div
            key={`a-${i}-${b.alt}`}
            className="flex items-center justify-center h-12 w-28 bg-white"
            style={{ minWidth: "7rem" }}
          >
            <img
              src={b.src}
              alt={b.alt}
              title={b.alt}
              className="h-10 w-24 object-contain opacity-80 hover:opacity-100 transition"
              style={{ maxHeight: "2.5rem", maxWidth: "6rem" }}
            />
          </div>
        ))}
        {/* bloque B idéntico para loop continuo */}
        {seq.map((b, i) => (
          <div
            key={`b-${i}-${b.alt}`}
            className="flex items-center justify-center h-12 w-28 bg-white"
            style={{ minWidth: "7rem" }}
            aria-hidden
          >
            <img
              src={b.src}
              alt=""
              className="h-10 w-24 object-contain opacity-80 transition"
              style={{ maxHeight: "2.5rem", maxWidth: "6rem" }}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
