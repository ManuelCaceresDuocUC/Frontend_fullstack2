// src/components/checkout/PaymentMethodSelector.tsx
"use client";
import Image from "next/image";

export type PaymentMethod = "MERCADOPAGO" | "WEBPAY" | "VENTIPAY";

export default function PaymentMethodSelector({
  value, onChange,
}: { value: PaymentMethod | null; onChange: (v: PaymentMethod) => void }) {
  const opt = [
    { id: "MERCADOPAGO", label: "Mercado Pago | Débito y Crédito", logos: ["/logos/visa.svg","/logos/mastercard.svg"] },
    { id: "WEBPAY",      label: "WebPay | Crédito",                 logos: ["/logos/visa.svg","/logos/mastercard.svg","/logos/amex.svg"] },
    { id: "VENTIPAY",    label: "VentiPay | Débito y Crédito",      logos: ["/logos/venti.svg","/logos/visa.svg","/logos/mastercard.svg"] },
  ] as const;

  return (
    <fieldset className="space-y-2">
      <legend className="font-semibold mb-1">Pago</legend>
      {opt.map(o => (
        <label key={o.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${value===o.id ? "border-blue-500 bg-blue-50" : "border-slate-300"}`}>
          <input
            type="radio" name="paymentMethod" value={o.id}
            checked={value===o.id} onChange={()=>onChange(o.id)}
            className="accent-blue-600"
          />
          <div className="flex-1">
            <div className="font-medium">{o.label}</div>
            <div className="text-xs text-slate-500">Serás redirigido para completar el pago de forma segura.</div>
          </div>
          <div className="flex gap-2">
            {o.logos.map(src => (
              <Image key={src} src={src} alt="" width={28} height={18} />
            ))}
          </div>
        </label>
      ))}
    </fieldset>
  );
}
