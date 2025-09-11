"use client";
import { useCart as useZustand, type CartItem } from "@/store/useCart";

type LegacyAddParams = {
  id: string;
  name: string;
  brand: string;
  ml?: number | null;
  price: number;
  image?: string;
  qty?: number;
};

type LegacyCart = {
  items: CartItem[];
  addItem: (p: LegacyAddParams) => void;
  remove: (id: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export function useCart(): LegacyCart {
  const { items, add, remove, clear, open, close } = useZustand();
  return {
    items,
    addItem: (p) =>
      add({
        id: p.id,
        name: p.name,
        brand: p.brand,
        ml: p.ml ?? null,
        price: p.price,
        image: p.image,
        qty: p.qty ?? 1,
      }),
    remove,
    clear,
    openDrawer: open,
    closeDrawer: close,
  };
}
