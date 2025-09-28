// app/admin/pedidos/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";
type PaymentStatus = "INITIATED" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";
type PaymentMethod = "WEBPAY" | "SERVIPAG" | "MANUAL";

type OrderItemView = {
  id: string; perfumeId: string; name: string; brand: string;
  ml: number | null; unitPrice: number; qty: number;
};

type ShipmentView = { tracking: string | null; carrier: string | null; delivered: boolean };
type PaymentView = { method: PaymentMethod; status: PaymentStatus } | null;

type OrderRow = {
  id: string;
  createdAt: string;
  buyerName: string;
  email: string;
  total: number;
  status: OrderStatus;
  payment: PaymentView;
  shipment: ShipmentView | null;
  shippingStreet: string; shippingCity: string; shippingRegion: string;
  shippingZip: string; shippingNotes: string;
  items: OrderItemView[];
};

const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export default function AdminOrders() {
  const [data, setData] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/orders", { cache: "no-store" });
    const rows = await r.json();
    setData(rows as OrderRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(o =>
      o.id.toLowerCase().includes(s) ||
      o.email.toLowerCase().includes(s) ||
      o.buyerName.toLowerCase().includes(s) ||
      o.items.some(it => (it.brand + " " + it.name).toLowerCase().includes(s))
    );
  }, [data, q]);

  async function setPaid(id: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" as OrderStatus }),
    });
    load();
  }

  async function markDelivered(id: string, delivered: boolean) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipment: { delivered } }),
    });
    load();
  }

  async function saveTracking(id: string, carrier: string, tracking: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipment: { carrier, tracking } }),
    });
    load();
  }

  async function sendInvoice(id: string, carrier: string, tracking: string) {
    // 1) guarda carrier+tracking
    await saveTracking(id, carrier, tracking);
    // 2) dispara correo con boleta
    const r = await fetch(`/api/orders/${id}/send-invoice`, { method: "POST" });
    if (!r.ok) alert(await r.text());
  }

  async function genLabel(id: string) {
    const r = await fetch(`/api/orders/${id}/label`, { method: "GET" });
    if (!r.ok) { alert(await r.text()); return; }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Etiqueta_${id}.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="pt-28 px-4 max-w-6xl mx-auto">
      <div className="h-16 md:h-20" />
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Gestor de pedidos</h1>
        <button onClick={load} className="px-3 py-1.5 rounded-lg border">Actualizar</button>
        <input
          value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Buscar por #id, cliente, email o producto"
          className="flex-1 px-3 py-2 rounded-lg border"
        />
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : filtered.length === 0 ? (
        <p>Sin pedidos.</p>
      ) : (
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Cliente</th>
                <th className="p-2 text-left">Pago</th>
                <th className="p-2 text-left">Envío</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <Row
                  key={o.id}
                  o={o}
                  onPaid={setPaid}
                  onDelivered={markDelivered}
                  onSaveTracking={saveTracking}
                  onSendInvoice={sendInvoice}
                  onGenLabel={genLabel}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Row(props: {
  o: OrderRow;
  onPaid: (id: string) => void;
  onDelivered: (id: string, delivered: boolean) => void;
  onSaveTracking: (id: string, carrier: string, tracking: string) => void;
  onSendInvoice: (id: string, carrier: string, tracking: string) => void;
  onGenLabel: (id: string) => void;
}) {
  const { o, onPaid, onDelivered, onSaveTracking, onSendInvoice, onGenLabel } = props;
  const [open, setOpen] = useState(false);
  const [carrier, setCarrier] = useState(o.shipment?.carrier ?? "");
  const [tracking, setTracking] = useState(o.shipment?.tracking ?? "");

  const canSend = Boolean(carrier && tracking && o.status === "PAID");

  return (
    <>
      <tr className="border-t align-top">
        <td className="p-2">{new Date(o.createdAt).toLocaleString("es-CL")}</td>
        <td className="p-2">
          <div className="font-medium">{o.buyerName}</div>
          <div className="text-slate-500">{o.email}</div>
        </td>
        <td className="p-2">
          <div>{o.payment ? `${o.payment.method} · ${o.payment.status}` : "—"}</div>
          <div className="text-slate-500">{o.status}</div>
        </td>
        <td className="p-2">
          <div>{o.shippingStreet}, {o.shippingCity}</div>
          <div className="text-slate-500">{o.shippingRegion} {o.shippingZip}</div>
          {o.shippingNotes && <div className="text-slate-500 italic">{o.shippingNotes}</div>}
        </td>
        <td className="p-2 text-right font-semibold">{fmt(o.total)}</td>
        <td className="p-2 text-right">
          <div className="flex gap-2 justify-end">
            {o.status !== "PAID" && (
              <button onClick={()=>onPaid(o.id)} className="px-2 py-1 rounded border hover:bg-slate-50">Marcar pagado</button>
            )}
            <button onClick={()=>setOpen(v=>!v)} className="px-2 py-1 rounded border hover:bg-slate-50">
              {open ? "Ocultar" : "Ver"}
            </button>
          </div>
        </td>
      </tr>

      {open && (
        <tr className="border-t bg-slate-50/50">
          <td colSpan={6} className="p-3">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <h3 className="font-semibold mb-2">Items</h3>
                <ul className="divide-y">
                  {o.items.map(it => (
                    <li key={it.id} className="py-2 flex justify-between">
                      <span>{it.brand} {it.name} {it.ml ? `· ${it.ml} ml` : ""} ×{it.qty}</span>
                      <span className="font-medium">{fmt(it.unitPrice * it.qty)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-2">Despacho</h3>
                  <label className="block text-sm">Carrier</label>
                  <input
                    value={carrier}
                    onChange={e=>setCarrier(e.target.value)}
                    placeholder="Bluexpress / Despacho propio"
                    className="w-full px-2 py-1 rounded border"
                  />
                  <label className="block text-sm mt-2">Tracking</label>
                  <input
                    value={tracking}
                    onChange={e=>setTracking(e.target.value)}
                    placeholder="BX1234567890"
                    className="w-full px-2 py-1 rounded border"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => onSaveTracking(o.id, carrier, tracking)}
                      className="px-2 py-1 rounded border hover:bg-white"
                    >
                      Guardar tracking
                    </button>

                    <a
                      href={`/api/orders/${o.id}/label`}
                      target="_blank"
                      rel="noopener"
                      className="px-2 py-1 rounded border hover:bg-white inline-flex items-center"
                    >
                      Ver etiqueta PDF
                    </a>

                    <button
                      onClick={async () => {
                        const r = await fetch(`/api/orders/${o.id}/send-invoice`, { method: "POST" });
                        if (!r.ok) alert(await r.text());
                        else alert("Boleta enviada");
                      }}
                      disabled={!(carrier && tracking && o.status === "PAID")}
                      className="px-2 py-1 rounded border hover:bg-white disabled:opacity-50"
                    >
                      Enviar boleta
                    </button>

                    <button
                      onClick={async () => {
                        const r = await fetch("/api/dte/boleta", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ orderId: o.id, tipo: 39 }),
                        });
                        const j = await r.json();
                        if (!r.ok) alert(JSON.stringify(j));
                        else alert(`DTE enviado. TrackID: ${j.trackid || "—"}`);
                      }}
                      className="px-2 py-1 rounded border hover:bg-white"
                    >
                      Emitir DTE (SII Cert)
                    </button>

                    <a
                      href={`/api/dte/${o.id}/pdf`}
                      target="_blank"
                      rel="noopener"
                      className="px-2 py-1 rounded border hover:bg-white inline-flex items-center"
                    >
                      Descargar Boleta PDF
                    </a>
                  </div>

                  <div className="text-xs text-slate-500 mt-1">
                    {o.shipment?.carrier || o.shipment?.tracking
                      ? `Actual: ${o.shipment?.carrier ?? ""} ${o.shipment?.tracking ?? ""}`.trim()
                      : "Sin datos de envío"}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Metadatos</h3>
                  <div className="text-xs text-slate-600 break-all"># {o.id}</div>
                  <div className="text-xs text-slate-600">Creado: {new Date(o.createdAt).toLocaleString("es-CL")}</div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
