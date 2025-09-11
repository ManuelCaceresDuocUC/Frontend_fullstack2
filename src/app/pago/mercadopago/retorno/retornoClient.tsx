"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function RetornoClient() {
  const sp = useSearchParams();

  const data = useMemo(() => ({
    collection_id: sp.get("collection_id") ?? "",
    collection_status: sp.get("collection_status") ?? "",
    payment_id: sp.get("payment_id") ?? sp.get("paymentId") ?? "",
    status: sp.get("status") ?? "",
    external_reference: sp.get("external_reference") ?? "",
    merchant_order_id: sp.get("merchant_order_id") ?? "",
    preference_id: sp.get("preference_id") ?? "",
  }), [sp]);

  useEffect(() => {
    // Aquí puedes notificar a tu backend si hace falta:
    // fetch("/api/payments/webhook", { method: "POST", body: JSON.stringify(data) }).catch(()=>{});
  }, [data]);

  return (
    <main className="pt-28 md:pt-36 min-h-[60vh] p-6">
      <h1 className="text-2xl font-bold mb-2">Procesando pago</h1>
      <p className="text-sm opacity-70">Estado: {data.status || data.collection_status || "desconocido"}</p>
    </main>
  );
}
