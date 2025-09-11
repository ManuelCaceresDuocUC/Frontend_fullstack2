// src/lib/payments/webpay.ts
const HOST = process.env.TBK_ENV === "prod"
  ? "https://webpay3g.transbank.cl"
  : "https://webpay3gint.transbank.cl";

export async function createWebpayTx({ orderId, total, returnUrl }:{
  orderId:string; total:number; returnUrl:string;
}) {
  const commerceCode = process.env.TBK_API_KEY_ID!;
  const secret = process.env.TBK_API_KEY_SECRET!;
  const url = `${HOST}/rswebpaytransaction/api/webpay/v1.2/transactions`;

  const body = {
    buy_order: orderId,
    session_id: `sess_${orderId}`,
    amount: total,
    return_url: returnUrl,
  };

  const r = await fetch(url, {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Tbk-Api-Key-Id": commerceCode,
      "Tbk-Api-Key-Secret": secret,
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json(); // { token, url }
  return { token: data.token, url: data.url };
}
