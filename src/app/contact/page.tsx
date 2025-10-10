"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

type FormData = {
  nombre: string;
  email: string;
  telefono: string;
  asunto: string;
  mensaje: string;
};

export default function ContactPage() {
  const [data, setData] = useState<FormData>({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: "",
  });
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const onChange =
    (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setData({ ...data, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);

    if (!data.nombre || !data.email || !data.mensaje) {
      setErrMsg("Completa nombre, email y mensaje.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setErrMsg("Email inválido.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.ok) {
        setOkMsg("Mensaje enviado. Te contactaremos pronto.");
        setData({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
      } else {
        setErrMsg("No se pudo enviar. Inténtalo de nuevo.");
      }
    } catch {
      setErrMsg("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="overflow-hidden">
      {/* HERO */}
      <section className="pt-10 md:pt-10 h-[60vh] md:h-[70vh] flex flex-col justify-center items-center text-center px-4 bg-gradient-to-b from-blue-600 to-indigo-800 text-white">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-extrabold mb-4"
        >
          Hablemos
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-lg md:text-2xl max-w-2xl"
        >
          Resolvemos dudas y cotizamos sin rodeos.
        </motion.p>
      </section>

      {/* CONTACT */}
      <section className="py-16 px-6 md:px-16 bg-white">
        <div className="grid md:grid-cols-5 gap-10 max-w-6xl mx-auto">
          {/* Info */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Contacto</h2>
            <p className="text-gray-600">
              Cuéntanos qué necesitas. Respondemos rápido.
            </p>

            <div className="bg-gray-50 p-6 rounded-2xl shadow">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>kuyval.contacto@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Phone className="h-5 w-5 text-blue-600" />
                <span>+56 9 96654293</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>Viña del Mar, Chile</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-3 bg-gray-50 p-6 rounded-2xl shadow space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nombre *</label>
                <input
                  value={data.nombre}
                  onChange={onChange("nombre")}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={onChange("email")}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="tucorreo@dominio.cl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Teléfono</label>
                <input
                  value={data.telefono}
                  onChange={onChange("telefono")}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="+56 9 ..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Asunto</label>
                <input
                  value={data.asunto}
                  onChange={onChange("asunto")}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Compra, venta, consulta…"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Mensaje *</label>
              <textarea
                value={data.mensaje}
                onChange={onChange("mensaje")}
                className="w-full min-h-[140px] rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Escribe tu mensaje"
                required
              />
            </div>

            {okMsg && <p className="text-green-600 text-sm">{okMsg}</p>}
            {errMsg && <p className="text-red-600 text-sm">{errMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-yellow-400 text-black px-6 py-3 rounded-2xl font-semibold shadow-lg hover:bg-yellow-300 transition disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {loading ? "Enviando..." : "Enviar mensaje"}
            </button>
          </motion.form>
        </div>
      </section>
    </main>
  );
}
