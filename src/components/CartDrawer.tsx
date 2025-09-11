"use client";
import Link from "next/link";
import { useCart } from "@/store/useCart";
const fmt = (n:number)=> n.toLocaleString("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0});

export default function CartDrawer() {
  const opened = useCart(s => s.opened);
  const close  = useCart(s => s.close);
  const items  = useCart(s => s.items);


  const total = items.reduce((s,i)=>s + i.price*i.qty, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity ${opened ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={close}
        style={{ zIndex: 50 }}
        aria-hidden={!opened}
      />
      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-[90vw] max-w-md bg-white text-slate-900 shadow-2xl transform transition-transform ${opened ? "translate-x-0" : "translate-x-full"}`}
        style={{ zIndex: 51 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Tu carrito</h2>
          <button onClick={close} aria-label="Cerrar" className="px-2 py-1 rounded hover:bg-slate-100">✕</button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-9rem)]">
          {items.length === 0 ? (
            <p className="text-slate-600">Vacío por ahora.</p>
          ) : (
            items.map(item => (
              <div key={`${item.id}-${item.ml}`} className="flex justify-between text-sm">
                <div>
                  <div className="font-medium">{item.brand} {item.name}</div>
                  <div className="text-slate-500">{item.ml ? `${item.ml} ml` : ""} ×{item.qty}</div>
                </div>
                <div className="font-semibold">{fmt(item.price * item.qty)}</div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t">
        <Link
          href="/checkout"
          onClick={close}
          className={`block text-center w-full rounded-xl px-4 py-2 ${
            items.length ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-300 text-slate-500 pointer-events-none"
          }`}
        >
          Ver detalle de compra
        </Link>
      </div>
      </aside>
    </>
  );
}
