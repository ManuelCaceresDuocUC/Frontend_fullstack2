// src/app/checkout/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/useCart";
import { REGIONES, COMUNAS } from "@/data/chile";

type PaymentMethod = "MERCADOPAGO" | "WEBPAY" | "VENTIPAY";
type Region = (typeof REGIONES)[number];

const fmt = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

const STORAGE_KEY = "checkout:v1";

type SavedForm = {
  email: string;
  buyerName: string;
  phone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingRegion: Region | "";
  shippingZip: string;
  shippingNotes: string;
  paymentMethod: PaymentMethod | null;
};

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  // hidratación y redirección si carrito vacío
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    if (hydrated && items.length === 0) router.replace("/galeria");
  }, [hydrated, items.length, router]);

  // --------- Totales ----------
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  // --------- Form state ----------
  const [email, setEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [phone, setPhone] = useState("");

  const [shippingStreet, setStreet] = useState("");
  const [shippingRegion, setRegion] = useState<Region>("Valparaíso");
  const [shippingCity, setCity] = useState<string>("");
  const [shippingZip, setZip] = useState("");
  const [shippingNotes, setNotes] = useState("");

  const [shippingFee, setShippingFee] = useState<number>(0);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = subtotal + (shippingFee || 0);

  // --------- Cargar guardado una sola vez ----------
  const loadedRef = useRef(false);
  useEffect(() => {
    if (!hydrated || loadedRef.current) return;
    loadedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<SavedForm>;
      if (s.email) setEmail(s.email);
      if (s.buyerName) setBuyerName(s.buyerName);
      if (s.phone) setPhone(s.phone ?? "");
      if (s.shippingStreet) setStreet(s.shippingStreet);
      if (s.shippingCity) setCity(s.shippingCity);
      if (s.shippingRegion) setRegion((s.shippingRegion as Region) ?? "Valparaíso");
      if (s.shippingZip) setZip(s.shippingZip ?? "");
      if (s.shippingNotes) setNotes(s.shippingNotes ?? "");
      if (s.paymentMethod) setPaymentMethod(s.paymentMethod);
    } catch {
      // ignora
    }
  }, [hydrated]);

  // --------- Guardar en localStorage ----------
  useEffect(() => {
    if (!hydrated) return;
    const toSave: SavedForm = {
      email, buyerName, phone,
      shippingStreet, shippingCity, shippingRegion, shippingZip, shippingNotes,
      paymentMethod,
    };
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [
    hydrated,
    email, buyerName, phone,
    shippingStreet, shippingCity, shippingRegion, shippingZip, shippingNotes,
    paymentMethod,
  ]);

  // --------- Cotizar envío ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!shippingRegion) { setShippingFee(0); return; }
        const res = await fetch("/api/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ region: shippingRegion, comuna: shippingCity, subtotal }),
        });
        const j: { cost?: number; error?: string } = await res.json();
        if (!alive) return;
        setShippingFee(res.ok ? Number(j.cost || 0) : 0);
      } catch {
        if (!alive) return;
        setShippingFee(0);
      }
    })();
    return () => { alive = false; };
  }, [shippingRegion, shippingCity, subtotal]);

  const disabled =
    loading ||
    items.length === 0 ||
    !agree ||
    !email ||
    !buyerName ||
    !shippingStreet ||
    !shippingCity ||
    !shippingRegion ||
    !paymentMethod;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    try {
      setLoading(true);
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
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
        paymentMethod,
      };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: { id: string; redirectUrl?: string } = await res.json();

      clear();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        router.replace(`/gracias/${data.id}`);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  return (
    <main className="pt-28 md:pt-36 min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 md:px-8 pb-16">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-6">Checkout</h1>

        <div className="grid md:grid-cols-[1fr_380px] gap-8">
          {/* --------- FORM --------- */}
          <form onSubmit={submit} className="space-y-6">
            {/* Pago */}
            <section className="rounded-2xl border border-slate-200 p-4 md:p-6">
              <h2 className="font-semibold text-lg mb-4">Pago</h2>
              <div className="space-y-2">
                {([
                  { id: "MERCADOPAGO", label: "Mercado Pago | Débito y Crédito" },
                  { id: "WEBPAY", label: "Webpay | Débito y Crédito" },
                  { id: "VENTIPAY", label: "VentiPay | Débito y Crédito" },
                ] as const).map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                      paymentMethod === opt.id ? "border-blue-500 bg-blue-50" : "border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      className="accent-blue-600"
                      checked={paymentMethod === opt.id}
                      onChange={() => setPaymentMethod(opt.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs text-slate-500">
                        Serás redirigido para completar el pago de forma segura.
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Contacto */}
            <section className="rounded-2xl border border-slate-200 p-4 md:p-6">
              <h2 className="font-semibold text-lg mb-4">Contacto</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="tucorreo@dominio.cl"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Nombre y apellido</label>
                  <input
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Teléfono (opcional)</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </section>

            {/* Envío */}
            <section className="rounded-2xl border border-slate-200 p-4 md:p-6">
              <h2 className="font-semibold text-lg mb-4">Dirección de envío</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Calle y número</label>
                  <input
                    required
                    value={shippingStreet}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Av. Siempre Viva 742"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Región</label>
                  <select
                    required
                    value={shippingRegion}
                    onChange={(e) => { setRegion(e.target.value as Region); setCity(""); }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    {REGIONES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Comuna</label>
                  <select
                    required
                    value={shippingCity}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="" disabled>Selecciona</option>
                    {(COMUNAS[shippingRegion] ?? []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">Código postal (opcional)</label>
                  <input
                    value={shippingZip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="0000000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm mb-1">Notas (opcional)</label>
                  <textarea
                    value={shippingNotes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    rows={3}
                    placeholder="Instrucciones para el repartidor, horario, etc."
                  />
                </div>
              </div>
            </section>

            {/* Términos + pagar */}
            <section className="rounded-2xl border border-slate-200 p-4 md:p-6 space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="accent-blue-600"
                />
                Estoy de acuerdo con los{" "}
                <Link href="/terminos" className="underline">
                  Términos del servicio
                </Link>
              </label>

              <button
                type="submit"
                disabled={disabled}
                className={`w-full md:w-auto px-6 py-3 rounded-2xl font-semibold text-white ${
                  disabled ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Procesando..." : "Pagar ahora"}
              </button>
            </section>
          </form>

          {/* --------- RESUMEN --------- */}
          <aside className="rounded-2xl border border-slate-200 p-4 md:p-6 h-max">
            <h2 className="font-semibold text-lg mb-4">Resumen</h2>

            <div className="space-y-4 max-h-[50vh] overflow-auto pr-1">
              {items.map((it) => (
                <div key={`${it.id}-${it.ml ?? "x"}`} className="flex items-center gap-3">
                  {it.image ? (
                    <div className="relative h-16 w-16 rounded overflow-hidden bg-slate-100">
                      <Image src={it.image} alt={it.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded bg-slate-100" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {it.brand} {it.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {it.ml ? `${it.ml} ml · ` : ""}x{it.qty}
                    </p>
                  </div>
                  <div className="text-sm font-semibold">{fmt(it.price * it.qty)}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>{shippingFee ? fmt(shippingFee) : "Por calcular / $0"}</span>
              </div>
              <div className="border-t my-2" />
              <div className="flex justify-between text-base font-extrabold">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
