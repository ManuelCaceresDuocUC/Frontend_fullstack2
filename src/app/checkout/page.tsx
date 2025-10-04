// src/app/checkout/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/useCart";
import { REGIONES, COMUNAS } from "@/data/chile";

// Helpers de envío (tarifas XS y umbral de envío gratis)
import {
  calcShipping,
  TARIFF_TABLE,
  type Tramo,
} from "@/components/ShippingMarquee";

type PaymentMethod = "WEBPAY";
type Region = (typeof REGIONES)[number];
type ShippingProvider = "Bluexpress" | "Despacho propio" | "";
function normalizeRegion(r: string): Region {
  const map: Record<string, Region> = {
    "Aysén del General Carlos Ibáñez del Campo": "Aysén",
    "Magallanes y de la Antártica Chilena": "Magallanes",
  };
  return (map[r] ?? r) as Region;
}
// ===== Config origen y zonas extremas =====
const ORIGIN_REGION: Region = "Valparaíso";
const EXTREMO: Region[] = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Aysén",       // <— antes: "Aysén del General Carlos Ibáñez del Campo"
  "Magallanes",  // <— antes: "Magallanes y de la Antártica Chilena"
];

function tramoFor(region: Region): Tramo {
  if (region === ORIGIN_REGION) return "misma_zona_region";
  if (EXTREMO.includes(region)) return "extremo_interregional";
  return "centro_interregional";
}
function tramoLabel(t: Tramo) {
  return t === "misma_zona_region"
    ? "misma zona y región"
    : t === "centro_interregional"
    ? "interregional centro"
    : "interregional extremo";
}

// ===== Pesos estimados por decant =====
const W_3ML = 45; // g
const W_5ML = 65; // g
const W_10ML = 120; // g
const W_PACK_BASE = 80; // g (caja + burbuja)

type CartWeightItem = { ml?: number | null; qty: number };
function decantsWeight(items: CartWeightItem[]) {
  let g = W_PACK_BASE;
  for (const it of items) {
    if (it.ml === 3) g += W_3ML * it.qty;
    else if (it.ml === 5) g += W_5ML * it.qty;
    else if (it.ml === 10) g += W_10ML * it.qty;
  }
  return g;
}
/** Talla por peso: XS≤0.5kg, S≤3kg, M≤6kg, L≤10kg */
function sizeForWeight(totalGrams: number): "XS" | "S" | "M" | "L" {
  if (totalGrams <= 500) return "XS";
  if (totalGrams <= 3000) return "S";
  if (totalGrams <= 6000) return "M";
  return "L";
}

// ===== Tipos locales =====
type Payment = PaymentMethod | null;
type QuoteResp =
  | { cost: number; provider: ShippingProvider; reason: string }
  | { error: string };

const fmt = (n: number) =>
  n.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
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

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated && items.length === 0) router.replace("/galeria");
  }, [hydrated, items.length, router]);

  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const [email, setEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [phone, setPhone] = useState("");

  const [shippingStreet, setStreet] = useState("");
  const [shippingRegion, setRegion] = useState<Region>("Valparaíso");
  const [shippingCity, setCity] = useState<string>("");
  const [shippingZip, setZip] = useState("");
  const [shippingNotes, setNotes] = useState("");

  const [shippingFee, setShippingFee] = useState<number>(0);
  const [shippingQuoted, setShippingQuoted] = useState<boolean>(false);
  const [shippingProvider, setShippingProvider] = useState<ShippingProvider>("");
  const [shippingReason, setShippingReason] = useState<string>("");

  const [paymentMethod, setPaymentMethod] = useState<Payment>("WEBPAY");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = subtotal + (shippingFee || 0);

  // cargar guardado
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
      if (s.shippingRegion)
        setRegion((s.shippingRegion as Region) ?? "Valparaíso");
      if (s.shippingZip) setZip(s.shippingZip ?? "");
      if (s.shippingNotes) setNotes(s.shippingNotes ?? "");
      if (s.paymentMethod) setPaymentMethod(s.paymentMethod);
    } catch {}
  }, [hydrated]);

  // guardar
  useEffect(() => {
    if (!hydrated) return;
    const toSave: SavedForm = {
      email,
      buyerName,
      phone,
      shippingStreet,
      shippingCity,
      shippingRegion,
      shippingZip,
      shippingNotes,
      paymentMethod,
    };
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [
    hydrated,
    email,
    buyerName,
    phone,
    shippingStreet,
    shippingCity,
    shippingRegion,
    shippingZip,
    shippingNotes,
    paymentMethod,
  ]);

  // ===== Cálculo local de envío por PESO (XS, S, M, L) y tramo por región =====
  useEffect(() => {
    const hasCart = subtotal > 0 && items.length > 0;
    if (!shippingRegion || !hasCart) {
      setShippingFee(0);
      setShippingQuoted(false);
      setShippingProvider("");
      setShippingReason("");
      return;
    }

    const tramo = tramoFor(shippingRegion);
    const grams = decantsWeight(
      items.map((i) => ({ ml: (i as any).ml, qty: i.qty }))
    );
    const size = sizeForWeight(grams);

    const fee = calcShipping({
      mode: "home", // domicilio
      tramo,
      size,
      subtotal, // aplica umbral de envío gratis del componente
      table: TARIFF_TABLE,
    });

    setShippingFee(fee);
    setShippingProvider("Bluexpress");
    setShippingReason(
      fee === 0
        ? "Envío gratis aplicado (supera el umbral)."
        : `Domicilio · ${tramoLabel(tramo)} · ${(grams / 1000).toFixed(
            2
          )} kg · talla ${size}`
    );
    setShippingQuoted(true);
  }, [shippingRegion, subtotal, items]);

  const disabled =
    loading ||
    items.length === 0 ||
    !agree ||
    !email ||
    !buyerName ||
    !shippingStreet ||
    !shippingCity ||
    !shippingRegion ||
    !paymentMethod ||
    !shippingQuoted;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    try {
      setLoading(true);

      // Solo variantes válidas
      const lineItems = items
        .filter((i) => typeof i.variantId === "string" && i.qty > 0)
        .map((i) => ({ variantId: i.variantId as string, qty: i.qty }));

      if (lineItems.length === 0) {
        alert("Error: carrito vacío");
        return;
      }

      // 1) Crea orden
      const r1 = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          shipping: { fee: shippingFee },
          items: lineItems,
          paymentMethod, // "WEBPAY"
        }),
      });
      const out1 = await r1.json().catch(() => ({}));
      if (!r1.ok) {
        alert(out1.error ?? "Error en checkout");
        return;
      }

      // 2) Inicializa pago y redirige
      const r2 = await fetch("/api/checkout/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: out1.id }),
      });
      const out2 = await r2.json();
      if (!r2.ok) {
        alert(out2.error ?? "No se pudo iniciar el pago");
        return;
      }

      if (out2.redirectUrl) {
        window.location.href = out2.redirectUrl;
        return;
      }

      if (out2.url && out2.token) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = out2.url;
        const inp = document.createElement("input");
        inp.type = "hidden";
        inp.name = "token_ws";
        inp.value = out2.token;
        form.appendChild(inp);
        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Último recurso
      router.replace(`/gracias/${out1.id}`);
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
          <form onSubmit={submit} className="space-y-6">
            <section className="rounded-2xl border border-slate-200 p-4 md:p-6">
              <h2 className="font-semibold text-lg mb-4">Pago</h2>
              <div className="space-y-2">
                {(
                  [
                    { id: "WEBPAY", label: "Webpay | Débito y Crédito" },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                      paymentMethod === opt.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-300"
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
                        Serás redirigido para completar el pago.
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

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
                    onChange={(e) => {
                      setRegion(e.target.value as Region);
                      setCity("");
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    {REGIONES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
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
                    <option value="" disabled>
                      Selecciona
                    </option>
                    {(COMUNAS[shippingRegion] ?? []).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

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

          <aside className="rounded-2xl border border-slate-200 p-4 md:p-6 h-max">
            <h2 className="font-semibold text-lg mb-4">Resumen</h2>
            <div className="space-y-4 max-h-[50vh] overflow-auto pr-1">
              {items.map((it) => (
                <div
                  key={`${it.variantId ?? it.productId}-${it.ml ?? "x"}`}
                  className="flex items-center gap-3"
                >
                  {it.image ? (
                    <div className="relative h-16 w-16 rounded overflow-hidden bg-slate-100">
                      <Image
                        src={it.image}
                        alt={it.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded bg-slate-100" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {it.brand} {it.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {it.ml ? `${it.ml} ml · ` : ""}
                      x{it.qty}
                    </p>
                  </div>
                  <div className="text-sm font-semibold">
                    {fmt(it.price * it.qty)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="flex items-center gap-2">
                  <span className="text-sm">
                    {shippingQuoted
                      ? shippingProvider || "Envío"
                      : "Calculando..."}
                  </span>
                </span>
                <span>
                  {shippingQuoted ? fmt(shippingFee) : "Calculando..."}
                </span>
              </div>
              {shippingQuoted && shippingReason && (
                <p className="text-xs text-slate-500">{shippingReason}</p>
              )}
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
