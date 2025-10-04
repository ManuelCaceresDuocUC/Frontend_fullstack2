// src/app/pago/webpay/mock/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token_ws") || "");

  const html = `<!doctype html><html><body>
  <form id="f" method="post" action="/pago/webpay/retorno">
    <input type="hidden" name="token_ws" value="${token}">
  </form>
  <script>document.getElementById('f').submit()</script>
  </body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET() {
  return new Response("Mock Webpay listo. Usa POST con token_ws.", { status: 200 });
}
