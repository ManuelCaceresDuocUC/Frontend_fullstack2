"use client";

import { motion } from "framer-motion";
import { Car, ShieldCheck, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import BrandMarquee from "@/components/BrandMarquee";
import Image from "next/image";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <Navbar />

      {/* HERO */}
<section className="relative px-4 aspect-[16/9]">
  <Image
    src="/KuyVal.png"
    alt="Hero"
    fill
    priority
    className="object-cover object-top"
    sizes="(max-width: 640px) 100vw,
           (max-width: 1024px) 100vw,
           100vw"
  />
</section>
<BrandMarquee />
      {/* FEATURES */}
      <section className="py-20 px-6 md:px-16 bg-white">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
          ¿Por qué elegirnos?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-lg transition text-center">
            <h3 className="text-xl font-semibold mb-2">Perfumes exclusivos</h3>
            <p className="text-gray-600">
              Cada perfume pasa por un proceso de revisión antes de publicarse.
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-lg transition text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Transparencia total</h3>
            <p className="text-gray-600">
              Publicamos información clara y confiable para que compres con confianza.
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-lg transition text-center">
            <Phone className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Atención personalizada</h3>
            <p className="text-gray-600">
              Estamos disponibles para responder tus dudas y ayudarte en tu compra.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
