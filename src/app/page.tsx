"use client";

import { motion } from "framer-motion";
import { Car, ShieldCheck, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <Navbar />

      {/* HERO */}
      <section className="pt-28 md:pt-36 h-screen pt-28 flex flex-col justify-center items-center text-center px-4 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2 }}
          className="text-5xl md:text-7xl font-extrabold mb-6"
        >
          Bienvenido a <span className="text-yellow-400">TuVolante.cl</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-lg md:text-2xl mb-8 max-w-2xl"
        >
          La forma más simple y transparente de encontrar tu próximo vehículo.
        </motion.p>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 md:px-16 bg-white">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
          ¿Por qué elegirnos?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-gray-50 p-6 rounded-2xl shadow hover:shadow-lg transition text-center">
            <Car className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Autos seleccionados</h3>
            <p className="text-gray-600">
              Cada vehículo pasa por un proceso de revisión antes de publicarse.
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
