// src/lib/shipping.ts
export type ShipOk = { cost: number; provider: string; reason: string };
export type ShipErr = { error: string };
export type ShipQuote = ShipOk | ShipErr;

export const SPECIAL_REGION = "Valparaíso";
export const BLUEXPRESS_FLAT = 4990;
export const LOCAL_FREE_OVER = 35000;
export const VALPO_BASE = 2490;

export function quoteShipping(p:{ region?: string; comuna?: string; subtotal: number }): ShipQuote {
  const region = (p.region ?? "").trim();
  const subtotal = p.subtotal | 0;
  if (!region) return { error: "Región requerida" };
  if (region === SPECIAL_REGION) {
    const cost = subtotal >= LOCAL_FREE_OVER ? 0 : VALPO_BASE;
    return { cost, provider:"Despacho propio",
      reason: cost===0 ? `Gratis sobre $${LOCAL_FREE_OVER.toLocaleString("es-CL")}` : "Tarifa región Valparaíso" };
  }
  return { cost: BLUEXPRESS_FLAT, provider:"Bluexpress", reason:"Tarifa plana" };
}
