"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BuyButton({ perfumeId }: { perfumeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfumeId, qty: 1 }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Error creando pedido");
      router.push(`/checkout?order=${j.id}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={onClick} disabled={loading} className="px-5 py-3 rounded-2xl bg-amber-300 text-black font-semibold hover:bg-yellow-300">
      {loading ? "Creando..." : "Comprar"}
    </button>
  );
}
