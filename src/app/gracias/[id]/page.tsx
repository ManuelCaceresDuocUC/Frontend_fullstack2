"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";

type OrderItemView = {
  id: string;
  brand: string;
  name: string;
  ml: number | null;
  unitPrice: number;
  qty: number;
};

type OrderView = {
  id: string;
  total: number;
  status: OrderStatus;
  items: OrderItemView[];
};

const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default function GraciasPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error(await r.text());
        const o: OrderView = await r.json();
        setOrder(o);
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, [id]);

  if (err) return <main className="pt-28 px-4">Error: {err}</main>;
  if (!order) return <main className="pt-28 px-4">Cargando…</main>;

  return (
    <main className="pt-28 px-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Gracias por tu compra</h1>
      <p className="text-slate-600 mb-6">Orden #{order.id}</p>

      <div className="rounded-2xl border bg-white p-4 text-slate-900">
        <div className="mb-3">
          <div className="flex justify-between">
            <span>Total</span><strong>{fmt(order.total)}</strong>
          </div>
          <div className="text-sm text-slate-600">Estado: {order.status}</div>
        </div>

        <div className="border-t pt-3">
          <h2 className="font-semibold mb-2">Items</h2>
          <ul className="space-y-1 text-sm">
            {order.items.map((it: OrderItemView) => (
              <li key={it.id} className="flex justify-between">
                <span>
                  {it.brand} {it.name} {it.ml ? `· ${it.ml} ml` : ""} ×{it.qty}
                </span>
                <span>{fmt(it.unitPrice * it.qty)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button onClick={() => router.push("/galeria")} className="mt-6 px-4 py-2 rounded-xl bg-blue-600 text-white">
        Seguir comprando
      </button>
    </main>
  );
}
