"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/useCart";

const fmt = (n:number)=> n.toLocaleString("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0});

export default function CartDrawer() {
  const opened = useCart(s => s.opened);
  const close  = useCart(s => s.close);
  const items  = useCart(s => s.items);
  const inc    = useCart(s => s.inc);     // (id:string, ml?:number)=>void
  const dec    = useCart(s => s.dec);     // (id:string, ml?:number)=>void
  const remove = useCart(s => s.remove);  // (id:string, ml?:number)=>void
  const setQty = useCart(s => s.setQty);  // (id:string, ml:number|undefined, qty:number)=>void

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
        className={`fixed top-0 right-0 h-full w-[92vw] max-w-md bg-white text-slate-900 shadow-2xl transform transition-transform ${opened ? "translate-x-0" : "translate-x-full"}`}
        style={{ zIndex: 51 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">Tu carrito</h2>
          <button onClick={close} aria-label="Cerrar" className="px-2 py-1 rounded hover:bg-slate-100">✕</button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-10rem)]">
          {items.length === 0 ? (
            <p className="text-slate-600">Vacío por ahora.</p>
          ) : (
            items.map(item => (
              <div key={`${item.id}-${item.ml ?? "na"}`} className="flex gap-3 p-2 rounded-xl border border-[var(--color-border)]">
                {/* thumb */}
                <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-[var(--color-surface)]">
                  <Image
                    src={item.image ?? "/placeholder.png"}
                    alt={`${item.brand} ${item.name}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <p className="font-medium truncate">{item.brand} {item.name}</p>
                      <p className="text-sm text-slate-500">{item.ml ? `${item.ml} ml` : "—"}</p>
                    </div>
                    <button
                      onClick={()=>remove(item.id, item.ml)}
                      className="text-sm text-slate-500 hover:text-red-600"
                      aria-label="Eliminar"
                    >
                      Eliminar
                    </button>
                  </div>

                  {/* qty controls */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-[var(--color-border)]">
                      <button
                        onClick={()=>dec(item.id, item.ml)}
                        className="px-3 py-1.5 hover:bg-slate-100"
                        aria-label="Disminuir"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e)=>{
                          const q = Math.max(1, Number(e.target.value || 1));
                          setQty(item.id, item.ml, q);
                        }}
                        className="w-12 text-center outline-none"
                        aria-label="Cantidad"
                      />
                      <button
                        onClick={()=>inc(item.id, item.ml)}
                        disabled={item.stock !== undefined && item.qty >= item.stock}
                        className="px-3 py-1.5 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Aumentar"
                      >
                        +
                      </button>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.stock !== undefined ? `Stock: ${item.stock}` : null}
                      </p>
                    </div>

                    <div className="text-right font-semibold">
                      {fmt(item.price * item.qty)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600">Total</span>
            <span className="text-lg font-bold">{fmt(total)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={close}
            className={`block text-center w-full rounded-xl px-4 py-3 ${items.length ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-600)]" : "bg-slate-300 text-slate-500 pointer-events-none"}`}
          >
            Ver detalle de compra
          </Link>
        </div>
      </aside>
    </>
  );
}
