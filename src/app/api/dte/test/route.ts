export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { buildDTE, loadCAF, stampDTEWithCAF, sendEnvioDTE, getToken } from "@/lib/dte";

export async function GET() {
  try {
    const { xml } = buildDTE({
      tipo: 39,
      folio: 1, // en real: pickFolio(39, usados)
      emisor: {
        rut: process.env.BILLING_RUT || "78255686-K",
        rz: process.env.BILLING_BUSINESS_NAME || "LOS CÁCERES SPA",
        giro: process.env.BILLING_GIRO || "Comercio al por menor de perfumes",
        dir: process.env.BILLING_ADDRESS || "Valparaíso",
        cmna: "Valparaíso",
      },
      receptor: { rut: "66666666-6", rz: "Cliente" },
      items: [{ nombre: "Perfume", qty: 1, precioNeto: 10000 }],
      fecha: new Date().toISOString().slice(0,10),
    });

    const caf = loadCAF(39);
    const dteFirmado = stampDTEWithCAF(xml, caf);

    const token = await getToken();
    const { trackid } = await sendEnvioDTE(dteFirmado, token);

    return Response.json({ ok: true, trackid });
   } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
  return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
