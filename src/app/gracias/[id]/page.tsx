// src/app/gracias/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";
type OrderItemView = { id:string; brand:string; name:string; ml:number|null; unitPrice:number; qty:number };
type OrderView = {
  id:string; total:number; subtotal:number; shippingFee:number; status:OrderStatus;
  email:string; buyerName:string;
  address?:{ street:string; city:string; region:string; zip?:string|null; notes?:string|null };
  shipping?:{ provider:"Bluexpress"|"Despacho propio"|null; tracking:string|null };
  invoice?:{ sent:boolean; url:string|null; number:string|null };
  items: OrderItemView[];
};
const fmt = (n:number) => n.toLocaleString("es-CL",{ style:"currency", currency:"CLP", maximumFractionDigits:0 });

export default function GraciasPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentInfo, setSentInfo] = useState<{ invoiceNumber?: string; tracking?: string }|null>(null);

  useEffect(() => {
    if (!id) return;
    let tries = 0, stop = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error(await r.text());
        const o: OrderView = await r.json();
        setOrder(o);
        if (o.status === "PENDING" && tries < 6 && !stop) { tries++; setTimeout(load, 1000); }
      } catch (e) { setErr((e as Error).message); }
    };
    load();
    return () => { stop = true; };
  }, [id]);

  async function sendInvoice() {
    if (!id) return;
    try {
      setSending(true);
      const r = await fetch(`/api/orders/${id}/send-invoice`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error al enviar boleta");
      setSentInfo({ invoiceNumber: j.invoiceNumber, tracking: j.tracking });
      // refresca datos
      const rr = await fetch(`/api/orders/${id}`, { cache:"no-store" });
      if (rr.ok) setOrder(await rr.json());
    } catch (e) { alert((e as Error).message); }
    finally { setSending(false); }
  }

  if (err) return <main className="pt-28 px-4">Error: {err}</main>;
  if (!order) return <main className="pt-28 px-4">Cargando…</main>;

  const badge = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    FULFILLED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-slate-100 text-slate-700",
  }[order.status];

  return (
    <main className="pt-28 px-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Gracias por tu compra</h1>
      <p className="text-slate-600">Orden #{order.id}</p>

      <div className="mt-4 flex items-center gap-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${badge}`}>{order.status}</span>
        {order.invoice?.number && <span className="text-xs text-slate-500">Boleta: {order.invoice.number}</span>}
      </div>

      <div className="mt-6 grid gap-6">
        {/* Totales */}
        <section className="rounded-2xl border bg-white p-4 text-slate-900">
          <div className="space-y-1">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Envío</span><span>{fmt(order.shippingFee)}</span></div>
            <div className="border-t my-2" />
            <div className="flex justify-between"><span>Total</span><strong>{fmt(order.total)}</strong></div>
          </div>
        </section>

        {/* Envío */}
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="font-semibold mb-3">Envío</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {order.shipping?.provider === "Bluexpress" && (
                <Image src="/logos/bluexpress.svg" alt="Bluexpress" width={100} height={20} />
              )}
              {order.shipping?.provider === "Despacho propio" && (
                <Image src="/icons/delivery.svg" alt="Despacho" width={22} height={22} />
              )}
              <span className="text-sm">{order.shipping?.provider ?? "Por asignar"}</span>
            </div>
            <div className="text-sm">
              {order.shipping?.tracking ? (
                <button
                  onClick={() => navigator.clipboard.writeText(order.shipping!.tracking!)}
                  className="underline"
                  title="Copiar"
                >
                  N° envío: {order.shipping.tracking}
                </button>
              ) : (
                <span className="text-slate-500">N° envío pendiente</span>
              )}
            </div>
          </div>
          {order.address && (
            <p className="text-sm text-slate-600 mt-2">
              {order.address.street}, {order.address.city}, {order.address.region}
            </p>
          )}
        </section>

        {/* Items */}
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="font-semibold mb-3">Items</h2>
          <ul className="space-y-1 text-sm">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>{it.brand} {it.name}{it.ml ? ` · ${it.ml} ml` : ""} ×{it.qty}</span>
                <span>{fmt(it.unitPrice * it.qty)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Acciones */}
        <section className="flex flex-wrap gap-3">
          <button
            onClick={sendInvoice}
            disabled={sending}
            className={`px-4 py-2 rounded-xl ${sending ? "bg-slate-400" : "bg-black hover:bg-slate-900"} text-white`}
          >
            {order.invoice?.sent ? "Reenviar boleta" : "Enviar boleta"}
          </button>
          <button
            onClick={() => router.push("/galeria")}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white"
          >
            Seguir comprando
          </button>
          {order.invoice?.url && (
            <a href={order.invoice.url} className="px-4 py-2 rounded-xl border" target="_blank" rel="noreferrer">
              Descargar boleta
            </a>
          )}
        </section>

        {sentInfo?.invoiceNumber && (
          <p className="text-xs text-green-700">
            Boleta N° {sentInfo.invoiceNumber} enviada. {sentInfo.tracking ? `N° envío: ${sentInfo.tracking}` : ""}
          </p>
        )}
      </div>
    </main>
  );
}
