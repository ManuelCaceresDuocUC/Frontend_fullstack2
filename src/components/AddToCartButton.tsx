// components/AddToCartButton.tsx
"use client";
import { useState } from "react";
import { useCart } from "@/store/useCart";

type Props = {
  productId: string;
  variantId?: string;
  name: string;
  brand: string;
  ml: number | null;
  price: number;           // <-- siempre requerido
  stock: number;
  image?: string | null;
  qty?: number;
  disabled?: boolean;
  className?: string;
};

export default function AddToCartButton(p: Props) {
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);
  const [loading, setLoading] = useState(false);

  const disabled = !!p.disabled || p.stock < 1 || loading;

  const handle = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      // valida server si hay variantId, pero no dependas del response
      if (p.variantId) {
        const r = await fetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId: p.variantId, qty: p.qty ?? 1, image: p.image }),
        });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          alert(e.error ?? "No se pudo agregar");
          return;
        }
      }
      // agrega al drawer local (sin 'id')
      add({
        productId: p.productId,
        variantId: p.variantId,
        name: p.name,
        brand: p.brand,
        ml: p.ml,
        price: p.price,
        qty: p.qty ?? 1,
        image: p.image ?? null,
        stock: p.stock,
      });
      open();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      disabled={disabled}
      onClick={handle}
      className={`btn btn-primary disabled:opacity-50 ${p.className ?? ""}`}
    >
      {p.stock < 1 ? "Sin stock" : loading ? "Agregando..." : "Agregar al carrito"}
    </button>
  );
}
