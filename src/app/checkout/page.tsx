// src/app/checkout/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/store/useCart";

type CartItem = {
  productId?: string;
  variantId?: string;
  name: string;
  brand: string;
  ml: number | null;
  price: number;
  qty: number;
  image?: string | null;
  stock: number;
};

type PaymentKind = "WEBPAY" | "SERVIPAG" | "MANUAL";

const fmt = (n: number) =>
  n.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

export default function Page() {
  // Cart
  const rawItems = useCart((s) => s.items);
  const items: CartItem[] = useMemo(
    () => (Array.isArray(rawItems) ? (rawItems as CartItem[]) : []),
    [rawItems]
  );

  // Form
  const [email, setEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingRegion, setShippingRegion] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentKind>("WEBPAY");
  const [sending, setSending] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items]
  );
  const shippingFee = 0;
  const total = subtotal + shippingFee;

  // Opcional: precargar email desde localStorage si lo usas
  useEffect(() => {
    const prev = localStorage.getItem("checkout.email");
    if (prev) setEmail(prev);
  }, []);
  useEffect(() => {
    if (email) localStorage.setItem("checkout.email", email);
  }, [email]);

  const submit = async () => {
    if (sending) return;

    const lineItems = items
      .filter((i) => typeof i.variantId === "string" && i.qty > 0)
      .map((i) => ({ variantId: i.variantId as string, qty: i.qty }));

    if (lineItems.length === 0) {
      alert("Error: carrito vacío");
      return;
    }
    if (!buyerName || !email) {
      alert("Faltan nombre y/o correo");
      return;
    }

    const payload = {
      email,
      buyerName,
      phone,
      address: {
        street: shippingStreet,
        city: shippingCity,
        region: shippingRegion,
        zip: shippingZip,
        notes: shippingNotes,
      },
      items: lineItems,
      paymentMethod, // el backend mapea a tu enum Prisma
    };

    setSending(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(out.error ?? "Error en checkout");
        return;
      }
      // Redirige a gracias. Si luego usas init de pago, cámbialo aquí.
      location.href = `/gracias/${out.id}`;
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="pt-28 md:pt-36 min-h-[70vh] px-4 py-10 bg-gray-50">
      <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-8">
        {/* Carrito */}
        <section className="md:col-span-3">
          <h1 className="text-2xl font-bold mb-4">Tu carrito</h1>

          {items.length === 0 ? (
            <div className="p-6 border rounded-xl bg-white">Carrito vacío</div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={`${it.variantId ?? it.productId}-${it.ml ?? "x"}`}
                  className="flex items-center justify-between gap-3 p-4 border rounded-xl bg-white"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {it.brand} {it.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {it.ml ? `${it.ml} ml` : "ml variable"} • {fmt(it.price)}
                    </div>
                    <div className="text-xs text-gray-500">Cant: {it.qty}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{fmt(it.price * it.qty)}</div>
                  </div>
                </div>
              ))}

              <div className="p-4 border rounded-xl bg-white">
                <div className="flex justify-between text-sm mb-1">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Envío</span>
                  <span>{fmt(shippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Datos de compra */}
        <section className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Datos</h2>

          <div className="space-y-3">
            <input
              type="text"
              className="w-full border rounded-lg p-3"
              placeholder="Nombre completo"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />
            <input
              type="email"
              className="w-full border rounded-lg p-3"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="tel"
              className="w-full border rounded-lg p-3"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <h3 className="font-semibold mt-4">Dirección de envío</h3>
            <input
              type="text"
              className="w-full border rounded-lg p-3"
              placeholder="Calle y número"
              value={shippingStreet}
              onChange={(e) => setShippingStreet(e.target.value)}
            />
            <input
              type="text"
              className="w-full border rounded-lg p-3"
              placeholder="Comuna / Ciudad"
              value={shippingCity}
              onChange={(e) => setShippingCity(e.target.value)}
            />
            <input
              type="text"
              className="w-full border rounded-lg p-3"
              placeholder="Región"
              value={shippingRegion}
              onChange={(e) => setShippingRegion(e.target.value)}
            />
            <input
              type="text"
              className="w-full border rounded-lg p-3"
              placeholder="Cód. Postal (opcional)"
              value={shippingZip}
              onChange={(e) => setShippingZip(e.target.value)}
            />
            <textarea
              className="w-full border rounded-lg p-3"
              placeholder="Notas (opcional)"
              value={shippingNotes}
              onChange={(e) => setShippingNotes(e.target.value)}
              rows={3}
            />

            <h3 className="font-semibold mt-4">Pago</h3>
            <select
              className="w-full border rounded-lg p-3"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentKind)}
            >
              <option value="WEBPAY">Webpay</option>
              <option value="SERVIPAG">Servipag</option>
              <option value="MANUAL">Manual / Transferencia</option>
            </select>

            <button
              onClick={submit}
              disabled={sending || items.length === 0}
              className="w-full mt-4 p-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
            >
              {sending ? "Procesando..." : "Pagar ahora"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
