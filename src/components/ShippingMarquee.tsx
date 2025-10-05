"use client";

import React from "react";

/**
 * ShippingMarquee + utils de cálculo de envío
 * - Muestra tipos de envío con precio inicial (XS)
 * - Calcula costo de despacho en checkout según tramo y tamaño estimado
 * - Incluye umbral de envío gratis
 */

/* =============================
 * Tarifario oficial (desde PDF)
 * ============================= */
export const TARIFF_TABLE = {
  home: {
    /** Envío dentro de la misma zona y región */
    misma_zona_region: { XS: 3100, S: 4200, M: 4800, L: 5400 },
    /** Santiago ↔ Centro, Centro ↔ Santiago, Centro ↔ Centro (distinta región) */
    centro_interregional: { XS: 4300, S: 5600, M: 7300, L: 9200 },
    /** Extremo ↔ Otra zona, Otra zona ↔ Extremo, Extremo ↔ Extremo (distinta región) */
    extremo_interregional: { XS: 5200, S: 9500, M: 14500, L: 17000 },
  },
  pickup: {
    /** En Punto Bluexpress / Copec */
    misma_zona_region: { XS: 2600, S: 3700, M: 4300, L: 4900 },
    centro_interregional: { XS: 3800, S: 5100, M: 6800, L: 8700 },
    extremo_interregional: { XS: 4700, S: 9000, M: 14000, L: 16500 },
  },
} as const;

export const FREE_SHIPPING_THRESHOLD = 49990; // CLP (ajustable)

/* =============================
 * Tipos y helpers
 * ============================= */
export type Mode = "home" | "pickup";
export type Tramo =
  | "misma_zona_region"
  | "centro_interregional"
  | "extremo_interregional";
export type Size = "XS" | "S" | "M" | "L";

export type Decants = { ml3?: number; ml5?: number; ml10?: number };

/**
 * Regla práctica para estimar tamaño por cantidad de decants.
 * - XS: 1–4 decants
 * - S : 5–12 decants
 * - M : 13–20 o caja rígida
 * - L : >20 o embalaje grande
 */
export function sizeForDecants(d: Decants, hasRigidBox = false): Size {
  const n3 = d.ml3 ?? 0;
  const n5 = d.ml5 ?? 0;
  const n10 = d.ml10 ?? 0;
  const total = n3 + n5 + n10;
  if (hasRigidBox) return total <= 12 ? "M" : "L";
  if (total <= 4) return "XS";
  if (total <= 12) return "S";
  if (total <= 20) return "M";
  return "L";
}

/** Obtiene precio de tabla */
export function shippingPrice(table: typeof TARIFF_TABLE, mode: Mode, tramo: Tramo, size: Size): number {
  return table[mode][tramo][size];
}

/**
 * Cálculo final para checkout.
 * - Si subtotal ≥ umbral, costo = 0.
 */
export function calcShipping({
  mode,
  tramo,
  size,
  subtotal,
  freeThreshold = FREE_SHIPPING_THRESHOLD,
  table = TARIFF_TABLE,
}: {
  mode: Mode;
  tramo: Tramo;
  size: Size;
  subtotal: number; // CLP
  freeThreshold?: number;
  table?: typeof TARIFF_TABLE;
}): number {
  if (subtotal >= freeThreshold) return 0;
  return shippingPrice(table, mode, tramo, size);
}

/* =============================
 * Marquee UI (sin <marquee>)
 * ============================= */
export default function ShippingMarquee({
  threshold = FREE_SHIPPING_THRESHOLD,
  className = "",
}: { threshold?: number; className?: string }) {
  const items = [
    `Envío a Domicilio desde: $${TARIFF_TABLE.home.misma_zona_region.XS.toLocaleString("es-CL")} (XS)`,
    `Envío a Punto Bluexpress desde: $${TARIFF_TABLE.pickup.misma_zona_region.XS.toLocaleString("es-CL")} (XS)`,
    `Envío Interregional centro desde $${TARIFF_TABLE.home.centro_interregional.XS.toLocaleString("es-CL")} (XS)`,
    `Envío Interregional extremo desde $${TARIFF_TABLE.home.extremo_interregional.XS.toLocaleString("es-CL")} (XS)`,
    `Envío gratis desde $${threshold.toLocaleString("es-CL")}`,
  ];

  // Duplicamos la lista para loop continuo
  const data = [...items, ...items];

  return (
    <div
      className={`relative isolate bg-slate-900 text-slate-100 border-b border-slate-800 ${className}`}
      role="region"
      aria-label="Información de envíos"
    >
      <div className="mx-auto max-w-7xl px-3">
        <div className="flex items-center gap-3 py-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/80 text-xs">ℹ️</span>
          <div className="relative overflow-hidden whitespace-nowrap flex-1">
            <div className="track inline-flex items-center gap-12 will-change-transform" style={{ animation: `marquee 20000ms linear infinite` }}>
              {data.map((t, i) => (
                <span key={i} className="text-sm md:text-[0.95rem] font-medium opacity-90 hover:opacity-100 transition-opacity">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button
            className="ml-2 text-xs px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            onMouseDown={(e) => toggleAnimation(true)}
            onMouseUp={(e) => toggleAnimation(false)}
            onFocus={() => toggleAnimation(true)}
            onBlur={() => toggleAnimation(false)}
          >
            Pausar
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee { 0% { transform: translate3d(0,0,0); } 100% { transform: translate3d(-50%,0,0); } }
        .track { will-change: transform; }
        div[aria-label="Información de envíos"]:hover .track,
        div[aria-label="Información de envíos"]:focus-within .track { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

function toggleAnimation(_pause: boolean) {
  // La pausa se maneja por :hover / :focus-within en CSS.
}

/* =============================
 * Ejemplos de uso
 * ============================= */
/**
// 1) Mostrar bajo el navbar
<ShippingMarquee className="sticky top-[56px]" />

// 2) Calcular en checkout
import { sizeForDecants, calcShipping, TARIFF_TABLE } from "@/components/ShippingMarquee";

const size = sizeForDecants({ ml3: 2, ml5: 4, ml10: 3 });
const costo = calcShipping({
  mode: "home",
  tramo: "centro_interregional",
  size,
  subtotal: 45990,
});
*/
