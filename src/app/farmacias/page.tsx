"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Clock, Phone, AlertCircle } from "lucide-react";

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
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const fetchFarmacias = async () => {
      try {
        // CAMBIO IMPORTANTE: Usamos 'corsproxy.io' en lugar de 'allorigins'.
        // Es más estable para este tipo de datos.
        const targetUrl = 'https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php';
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;

        const res = await fetch(proxyUrl);
        
        // 1. Verificamos si la respuesta HTTP es correcta
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        
        // 2. Obtenemos el texto crudo primero para ver qué llegó
        const textData = await res.text();

        // 3. Intentamos convertir ese texto a JSON
        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
            console.error("No llegó un JSON, llegó esto:", textData.substring(0, 500));
            throw new Error("El servidor devolvió HTML en lugar de datos.");
        }
        
        // 4. Si es un array, lo guardamos
        if (Array.isArray(data)) {
          setFarmacias(data);
        } else {
            console.error("Formato inesperado:", data);
            setError("El formato de datos no es válido hoy.");
        }

      } catch (err) {
        console.error("Error cargando farmacias:", err);
        setError("No pudimos cargar los turnos. Intenta recargar la página.");
      } finally {
        setLoading(false);
      }
    };

    fetchFarmacias();
  }, []);

  const farmaciasFiltradas = farmacias.filter((f) => {
    const termino = busqueda.toLowerCase();
    // Agregamos validación por si algún campo viene nulo
    const nombre = f.local_nombre?.toLowerCase() || "";
    const comuna = f.comuna_nombre?.toLowerCase() || "";
    return comuna.includes(termino) || nombre.includes(termino);
  });

  return (
    <main className="min-h-screen bg-slate-50 pt-32 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Farmacias de Turno</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Datos oficiales en tiempo real.
          </p>
        </div>

        {/* Buscador */}
        <div className="max-w-xl mx-auto mb-12 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Busca tu comuna (ej: Santiago, Viña...)"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 text-lg outline-none text-slate-900"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {!loading && !error && (
            <div className="text-center mt-2 text-sm text-slate-500">
              {farmaciasFiltradas.length} farmacias encontradas
            </div>
          )}
        </div>

        {/* Estado de Carga */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Estado de Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-10 text-red-500 bg-red-50 rounded-2xl border border-red-100 mb-8">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p className="font-medium">{error}</p>
            <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm hover:bg-red-50 transition text-red-700"
            >
                Intentar de nuevo
            </button>
          </div>
        )}

        {/* Grid de Resultados */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmaciasFiltradas.map((f, i) => (
              <motion.div
                key={f.local_id || i} // Fallback key por si local_id viene duplicado o null
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                      {f.comuna_nombre}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">{f.local_nombre}</h3>
                </div>

                <div className="space-y-3 text-slate-600 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{f.local_direccion}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-slate-400 shrink-0" />
                    <span>Cierra: {f.funcionamiento_hora_cierre} hrs</span>
                  </div>

                  {f.local_telefono && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                      <a href={`tel:${f.local_telefono}`} className="hover:text-blue-600 underline">
                        Llamar
                      </a>
                    </div>
                  )}
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${f.local_lat},${f.local_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block w-full text-center py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
                >
                  Cómo llegar
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}