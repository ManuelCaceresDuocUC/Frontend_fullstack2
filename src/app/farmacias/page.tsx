"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Clock, Phone } from "lucide-react";

// Tipo de dato que viene de tu API
interface Farmacia {
  local_id: string;
  local_nombre: string;
  comuna_nombre: string;
  local_direccion: string;
  funcionamiento_hora_apertura: string;
  funcionamiento_hora_cierre: string;
  local_telefono: string;
  local_lat: string;
  local_lng: string;
}

export default function FarmaciasPage() {
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Obtenemos los datos al cargar la página
  useEffect(() => {
    const fetchFarmacias = async () => {
      try {
        // Llamamos a TU route.ts interno (asumiendo que lo creaste como vimos antes)
        // Si aún no tienes el route.ts, avísame para dártelo de nuevo.
        const res = await fetch("/api/farmacias");
        const data = await res.json();
        setFarmacias(data.farmacias || []);
      } catch (error) {
        console.error("Error cargando farmacias:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmacias();
  }, []);

  // Filtramos localmente por comuna o nombre
  const farmaciasFiltradas = farmacias.filter((f) => {
    const termino = busqueda.toLowerCase();
    return (
      f.comuna_nombre.toLowerCase().includes(termino) ||
      f.local_nombre.toLowerCase().includes(termino)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50 pt-32 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Farmacias de Turno</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Información oficial del MINSAL actualizada en tiempo real. Encuentra la farmacia abierta más cercana a tu ubicación hoy.
          </p>
        </div>

        {/* Buscador */}
        <div className="max-w-xl mx-auto mb-12 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Escribe tu comuna (ej: Maipú, Santiago...)"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg outline-none transition"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="text-center mt-2 text-sm text-slate-500">
            Mostrando {farmaciasFiltradas.length} farmacias
          </div>
        </div>

        {/* Grid de Resultados */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmaciasFiltradas.map((f) => (
              <motion.div
                key={f.local_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                      {f.comuna_nombre}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900">{f.local_nombre}</h3>
                  </div>
                </div>

                <div className="space-y-3 text-slate-600 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{f.local_direccion}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-slate-400 shrink-0" />
                    <span>Cierra: {f.funcionamiento_hora_cierre} hrs</span>
                  </div>

                  {f.local_telefono && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                      <a href={`tel:${f.local_telefono}`} className="hover:text-blue-600 underline">
                        {f.local_telefono}
                      </a>
                    </div>
                  )}
                </div>

                {/* Botón para abrir mapa */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${f.local_lat},${f.local_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block w-full text-center py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
                >
                  Ver en Mapa
                </a>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && farmaciasFiltradas.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No encontramos farmacias de turno para esa comuna hoy.
          </div>
        )}
      </div>
    </main>
  );
}