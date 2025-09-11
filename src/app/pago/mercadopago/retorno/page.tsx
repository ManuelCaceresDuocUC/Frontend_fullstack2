// src/app/pago/mercadopago/retorno/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MPReturn() {
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Mercado Pago devuelve ?external_reference=<orderId> entre otros params
    const orderId = sp.get("external_reference");
    router.replace(orderId ? `/gracias/${orderId}` : "/galeria");
  }, [sp, router]);

  return null;
}
