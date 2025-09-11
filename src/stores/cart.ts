"use client";
import { create } from "zustand";

export type CartItem = {
  id: string;
  name: string;
  brand: string;
  ml: number | null;
  price: number;
  image?: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  opened: boolean;
  open: () => void;
  close: () => void;
  add: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>((set) => ({
  items: [],
  opened: false,
  open: () => set({ opened: true }),
  close: () => set({ opened: false }),

  add: (item) =>
    set((s) => {
      const qty = item.qty ?? 1;
      const idx = s.items.findIndex(
        (i) => i.id === item.id && i.ml === (item.ml ?? null)
      );
      if (idx >= 0) {
        const next = [...s.items];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return { items: next };
      }
      return {
        items: [
          ...s.items,
          {
            id: item.id,
            name: item.name,
            brand: item.brand,
            ml: item.ml ?? null,
            price: item.price,
            image: item.image,
            qty,
          },
        ],
      };
    }),

  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
}));
