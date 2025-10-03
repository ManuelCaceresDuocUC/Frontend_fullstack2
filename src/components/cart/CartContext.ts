"use client";
import { useCart as useZustand, type CartItem } from "@/store/useCart";

type LegacyAddParams = {
  id: string;               // = productId legacy
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
  remove: (id: string, ml?: number | null) => void;
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
        productId: p.id,     // <- mapear id legacy a productId
        variantId: undefined,
        name: p.name,
        brand: p.brand,
        ml: p.ml ?? null,
        price: p.price,
        image: p.image ?? null,
        stock: 9999,         // <- legacy sin stock por variante
        qty: p.qty ?? 1,
      }),
    remove,
    clear,
    openDrawer: open,
    closeDrawer: close,
  };
}
