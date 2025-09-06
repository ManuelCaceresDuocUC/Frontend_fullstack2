import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  // Validación mínima en el servidor
  const required = ["nombre", "email", "mensaje"];
  const missing = required.filter((k) => !body?.[k]);
  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: `Faltan campos: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Aquí podrías integrar Nodemailer, Resend o Slack.
  // Por ahora, solo “simulamos” el envío.
  console.log("CONTACTO:", body);

  return NextResponse.json({ ok: true });
}
