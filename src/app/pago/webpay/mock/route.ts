// src/app/pago/webpay/mock/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const returnUrl = u.searchParams.get("return") || "/";
  const token = u.searchParams.get("token_ws") || `mock_${Date.now()}`;

  const html = `<!doctype html><meta charset="utf-8">
  <title>Mock Webpay</title>
  <h1>Mock Webpay</h1>
  <p>Simulador: autoriza el pago.</p>
  <form method="POST" action="/pago/webpay/mock?return=${encodeURIComponent(returnUrl)}&token_ws=${encodeURIComponent(token)}">
    <button type="submit">Autorizar pago</button>
  </form>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function POST(req: Request) {
  const u = new URL(req.url);
  const returnUrl = u.searchParams.get("return") || "/";
  const token = u.searchParams.get("token_ws") || `mock_${Date.now()}`;
  return NextResponse.redirect(`${returnUrl}?token_ws=${encodeURIComponent(token)}`, 303);
}
