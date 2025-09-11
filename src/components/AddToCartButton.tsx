"use client";

import { useCart } from "@/stores/cart";

type Props = {
  id: string;
  name: string;
  brand: string;
  price: number;
  ml: number;
  image?: string;
  disabled?: boolean;
};

export default function AddToCartButton({
  id, name, brand, price, ml, image, disabled = false,
}: Props) {
  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);

  const onClick = () => {
    if (disabled) return;
    add({ id, name, brand, ml, price, image, qty: 1 });
    open();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`rounded-2xl px-5 py-3 font-semibold ${
        disabled ? "bg-gray-400 cursor-not-allowed text-white/80"
                 : "bg-emerald-500 hover:bg-emerald-600 text-white"
      }`}
    >
      Agregar
    </button>
  );
}
