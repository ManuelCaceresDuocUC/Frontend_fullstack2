// src/lib/payments/webpay.ts

const isProd = /^(prod|production|live)$/i.test(process.env.TBK_ENV ?? "");
const HOST = isProd
  ? "https://webpay3g.transbank.cl"
  : "https://webpay3gint.transbank.cl";

type TBKHeaders = {
  "Content-Type": "application/json";
  "Tbk-Api-Key-Id": string;     // Commerce Code
  "Tbk-Api-Key-Secret": string; // API Key Secret
};

function tbkHeaders(): TBKHeaders {
  const id = process.env.TBK_API_KEY_ID ?? "";
  const secret = process.env.TBK_API_KEY_SECRET ?? "";
  if (!id || !secret) throw new Error("Faltan TBK_API_KEY_ID / TBK_API_KEY_SECRET");
  return { "Content-Type": "application/json", "Tbk-Api-Key-Id": id, "Tbk-Api-Key-Secret": secret };
}

async function tbkFetch<T>(url: string, init: RequestInit, timeoutMs = 15000): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, { ...init, signal: ac.signal });
    if (!r.ok) throw new Error(await r.text());
    return (await r.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export type WebpayCreateResponse = { token: string; url: string };
export type WebpayCommitResponse = {
  buy_order: string;
  session_id?: string;
  status: string; // "AUTHORIZED" | ...
  [k: string]: unknown;
};

export async function createWebpayTx(params: {
  orderId: string;
  total: number;      // CLP entero
  returnUrl: string;  // absoluta
}): Promise<WebpayCreateResponse> {
  const { orderId, total, returnUrl } = params;
  return tbkFetch<WebpayCreateResponse>(
    `${HOST}/rswebpaytransaction/api/webpay/v1.2/transactions`,
    {
      method: "POST",
      headers: tbkHeaders(),
      body: JSON.stringify({
        buy_order: orderId,
        session_id: `sess_${orderId}`,
        amount: Math.round(total), // asegura entero
        return_url: returnUrl,
      }),
    }
  );
}

export async function commitWebpayTx(token: string): Promise<WebpayCommitResponse> {
  return tbkFetch<WebpayCommitResponse>(
    `${HOST}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
    { method: "PUT", headers: tbkHeaders() }
  );
}

export async function statusWebpayTx(token: string): Promise<WebpayCommitResponse> {
  return tbkFetch<WebpayCommitResponse>(
    `${HOST}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
    { method: "GET", headers: tbkHeaders() }
  );
}
