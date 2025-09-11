// src/lib/payments/venti.ts
export async function createVentiSession({ orderId, total, returnUrl, webhookUrl }:{
  orderId:string; total:number; returnUrl:string; webhookUrl:string;
}) {
  const key = process.env.VENTI_SECRET_KEY!;
  const env = process.env.VENTI_ENV === "live" ? "https://api.venti.app" : "https://api.sandbox.venti.app";
  const r = await fetch(`${env}/v1/checkout/sessions`,{
    method:"POST",
    headers:{ "Content-Type":"application/json", Authorization:`Bearer ${key}` },
    body: JSON.stringify({
      external_id: orderId,
      amount: total,
      currency: "CLP",
      success_url: returnUrl,
      failure_url: returnUrl,
      webhook_url: webhookUrl,
    })
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json(); // { url, ... }
  return { url: data.url };
}
