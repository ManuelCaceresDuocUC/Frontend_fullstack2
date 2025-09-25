// src/lib/shipping.ts
export type ShipOk = { cost: number; provider: "Bluexpress" | "Despacho propio"; reason: string };
export type ShipErr = { error: string };
export type ShipQuote = ShipOk | ShipErr;

export const SPECIAL_REGION = "Valparaíso";
export const BLUEXPRESS_FLAT = 4990;
export const VALPO_BASE = 2490;

// Umbral global configurable por .env (fallback 35.000)
export const FREE_OVER = Number(process.env.FREE_SHIPPING_OVER_CLP ?? 35000);

export function quoteShipping(params: { region?: string; comuna?: string; subtotal: number }): ShipQuote {
  const region = (params.region ?? "").trim();
  const subtotal = params.subtotal | 0;
  if (!region) return { error: "Región requerida" };

  // 1) Envío gratis global por monto, sin importar región
  if (subtotal >= FREE_OVER) {
    return {
      cost: 0,
      provider: region === SPECIAL_REGION ? "Despacho propio" : "Bluexpress",
      reason: `Gratis sobre $${FREE_OVER.toLocaleString("es-CL")}`,
    };
  }

  // 2) Regla especial Valparaíso
  if (region === SPECIAL_REGION) {
    return { cost: VALPO_BASE, provider: "Despacho propio", reason: "Tarifa región Valparaíso" };
  }

  // 3) Resto de regiones → Bluexpress
  return { cost: BLUEXPRESS_FLAT, provider: "Bluexpress", reason: "Tarifa plana" };
}
