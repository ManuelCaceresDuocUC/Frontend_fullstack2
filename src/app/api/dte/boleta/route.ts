// src/app/api/dte/boleta/route.ts
import { NextResponse } from "next/server";
import { buildDTE, getToken, sendEnvioDTE } from "@/lib/dte";
import { ensureMtlsDispatcher } from "@/lib/cert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // mTLS listo (si falta cert/pass, aquí lanzará y lo capturamos)
    ensureMtlsDispatcher();

    const { orderId, tipo } = await req.json();

    // DTE mínimo de prueba (reemplaza con datos reales de la orden)
    const { xml } = buildDTE({
      tipo: (tipo ?? 39) as 39 | 41,
      folio: 1, // usa tu CAF y asignación real
      fecha: new Date().toISOString().slice(0, 10),
      emisor: {
        rut: process.env.BILLING_RUT || "11111111-1",
        rz: process.env.BILLING_RZ || "MAfums",
        giro: process.env.BILLING_GIRO || "Venta de perfumes",
        dir: process.env.BILLING_DIR || "Dirección",
        cmna: process.env.BILLING_CMNA || "Comuna",
      },
      receptor: { rut: "66666666-6", rz: "Cliente" },
      items: [{ nombre: `Pedido ${orderId}`, qty: 1, precioNeto: 1000 }],
    });

    const token = await getToken();                 // Ambiente Certificación (PALENA)
    const { trackid } = await sendEnvioDTE(xml, token);

    return NextResponse.json({ trackid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("API /dte/boleta error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
