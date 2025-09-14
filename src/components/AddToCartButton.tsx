"use client";
import { useCart } from "@/store/useCart";

type Props = {
  id: string;
  name: string;
  brand: string;
  price: number;
  ml: number | null;
  image?: string;
  stock: number;          // ← nuevo
  disabled?: boolean;
};

export default function AddToCartButton(p: Props) {
  const add = useCart(s => s.add);
  const open = useCart(s => s.open);

  return (
    <button
      disabled={p.disabled || p.stock < 1}
      onClick={() => {
        add({
          id: p.id, name: p.name, brand: p.brand, ml: p.ml,
          price: p.price, image: p.image, stock: Number(p.stock), qty: 1, // ← usa stock
        });
        open();
      }}
      className="btn btn-primary disabled:opacity-50"
    >
      {p.stock < 1 ? "Sin stock" : "Agregar al carrito"}
    </button>
  );
}
