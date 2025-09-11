// src/components/CartFab.tsx
"use client";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/store/useCart";

export default function CartFab() {
  const items = useCart(s => s.items);
  const open  = useCart(s => s.open);
  const count = items.reduce((n, it) => n + it.qty, 0);

  return (
    <button
      onClick={open}
      className="fixed bottom-6 right-6 rounded-full bg-blue-600 text-white p-4 shadow-lg"
      aria-label="Abrir carrito"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 text-xs px-2 py-0.5 rounded-full bg-white text-blue-700 font-bold">
            {count}
          </span>
        )}
      </div>
    </button>
  );
}
