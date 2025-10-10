// src/app/api/contact/route.ts
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FormData = {
  nombre?: string;
  email?: string;
  telefono?: string;
  asunto?: string;
  mensaje?: string;
};

const RATE = new Map<string, { c: number; t: number }>();
const WIN = 60_000; // 1 min
const MAX = 3;

export async function POST(req: Request) {
  // rate limit simple por IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
  const now = Date.now();
  const prev = RATE.get(ip);
  if (prev && now - prev.t < WIN && prev.c >= MAX) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  RATE.set(ip, { c: (prev?.c ?? 0) + 1, t: prev?.t ?? now });

  const b = (await req.json()) as FormData;

  // validación
  const nombre = (b.nombre || "").trim();
  const email = (b.email || "").trim();
  const telefono = (b.telefono || "").trim();
  const asunto = (b.asunto || "Contacto desde web").trim();
  const mensaje = (b.mensaje || "").trim();

  if (!nombre || !email || !mensaje) {
    return NextResponse.json({ ok: false, error: "Faltan campos: nombre, email, mensaje" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Email inválido" }, { status: 400 });
  }

  const TO = process.env.CONTACT_TO;
  if (!TO) {
    return NextResponse.json({ ok: false, error: "CONTACT_TO no configurado" }, { status: 500 });
  }

  // 1) correo a la empresa
  await sendEmail({
    to: TO,
    replyTo: `${nombre} <${email}>`,
    subject: `📩 ${asunto} — ${nombre}`,
    text:
`Nombre: ${nombre}
Email: ${email}
Teléfono: ${telefono || "-"}
Asunto: ${asunto}

Mensaje:
${mensaje}`,
    html:
`<p><b>Nombre:</b> ${esc(nombre)}</p>
<p><b>Email:</b> ${esc(email)}</p>
<p><b>Teléfono:</b> ${esc(telefono || "-")}</p>
<p><b>Asunto:</b> ${esc(asunto)}</p>
<p><b>Mensaje:</b><br/>${esc(mensaje).replace(/\n/g, "<br/>")}</p>`,
  });

  // 2) acuse al cliente
  await sendEmail({
    to: email,
    subject: "Recibimos tu mensaje",
    text:
`Hola ${nombre},
Gracias por escribirnos. Te responderemos a este mismo correo.

Resumen:
- Asunto: ${asunto}
- Teléfono: ${telefono || "-"}

Tu mensaje:
${mensaje}

Los Cáceres SpA`,
  });

  return NextResponse.json({ ok: true });
}

function esc(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
