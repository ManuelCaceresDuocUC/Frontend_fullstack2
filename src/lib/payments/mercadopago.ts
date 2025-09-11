// src/lib/payments/mercadopago.ts
export type MPItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: "CLP";
};

type CreatePrefArgs = {
  orderId: string;
  items: MPItem[];
  returnUrl: string;
  webhookUrl: string;
  payerEmail?: string; // opcional
};

type MPPreference = {
  id: string;
  init_point: string;          // prod / sandbox redirige igual en modo test
  sandbox_init_point?: string; // útil si quieres forzar sandbox URL
};

export async function createMPPreference({
  orderId,
  items,
  returnUrl,
  webhookUrl,
  payerEmail,
}: CreatePrefArgs): Promise<MPPreference> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN no definido");

  const body = {
    items,
    back_urls: { success: returnUrl, failure: returnUrl, pending: returnUrl },
    auto_return: "approved",
    notification_url: webhookUrl,
    external_reference: orderId,
    binary_mode: true, // solo aprobado o rechazado, evita 'pending'
    metadata: { orderId },
    ...(payerEmail ? { payer: { email: payerEmail } } : {}),
    // opcional: limitar cuotas/métodos
    // payment_methods: { installments: 1 }
    // opcional: etiqueta en voucher
    // statement_descriptor: "TU-MARCA"
  };

  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as MPPreference;
}
