// src/lib/payments/webpay.ts
const HOST =
  (process.env.TBK_ENV ?? "").toLowerCase() === "prod"
    ? "https://webpay3g.transbank.cl"
    : "https://webpay3gint.transbank.cl";

function tbkHeaders() {
  const id = process.env.TBK_API_KEY_ID!;
  const secret = process.env.TBK_API_KEY_SECRET!;
  if (!id || !secret) throw new Error("Faltan TBK_API_KEY_ID/TBK_API_KEY_SECRET");
  return {
    "Content-Type": "application/json",
    "Tbk-Api-Key-Id": id,       // Commerce Code
    "Tbk-Api-Key-Secret": secret,
  };
}

export async function createWebpayTx(params: {
  orderId: string;
  total: number;
  returnUrl: string;
}) {
  const { orderId, total, returnUrl } = params;
  const r = await fetch(
    `${HOST}/rswebpaytransaction/api/webpay/v1.2/transactions`,
    {
      method: "POST",
      headers: tbkHeaders(),
      body: JSON.stringify({
        buy_order: orderId,
        session_id: `sess_${orderId}`,
        amount: total,
        return_url: returnUrl,
      }),
    }
  );
  if (!r.ok) throw new Error(await r.text());
  const data = (await r.json()) as { token: string; url: string };
  return { token: data.token, url: data.url };
}

export async function commitWebpayTx(token: string) {
  const r = await fetch(
    `${HOST}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
    { method: "PUT", headers: tbkHeaders() }
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function statusWebpayTx(token: string) {
  const r = await fetch(
    `${HOST}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
    { method: "GET", headers: tbkHeaders() }
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
