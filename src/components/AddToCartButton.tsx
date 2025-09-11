"use client";
import { useCart } from "@/components/cart/CartContext";

type Props = {
  id: string; name: string; brand: string;
  ml?: number | null; price: number; image?: string;
};

export default function AddToCartButton(p: Props) {
  const { addItem, openDrawer } = useCart();

  return (
    <button
      onClick={() => {
        addItem({ id: p.id, name: p.name, brand: p.brand, ml: p.ml ?? null, price: p.price, image: p.image, qty: 1 });
        openDrawer();
      }}
      className="rounded-xl px-3 py-2 bg-blue-600 text-white"
    >
      Agregar
    </button>
  );
}
