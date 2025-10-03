"use client";
import { create } from "zustand";

export type CartItem = {
  id: string;                 // = variantId || productId (línea de carrito)
  productId?: string;
  variantId?: string;
  name: string;
  brand: string;
  ml: number | null;
  price: number;
  qty: number;
  image?: string | null;
  stock?: number;             // puede no venir
};

type AddInput = Omit<CartItem, "qty" | "id"> & { qty?: number };

type CartState = {
  items: CartItem[];
  opened: boolean;                           // <- coincide con CartDrawer
  open: () => void;
  close: () => void;
  add: (i: AddInput) => void;
  remove: (id: string, ml?: number | null) => void;           // <- 2 args
  inc: (id: string, ml?: number | null) => void;              // <- 2 args
  dec: (id: string, ml?: number | null) => void;              // <- 2 args
  setQty: (id: string, ml: number | null | undefined, qty: number) => void; // <- 3 args
  clear: () => void;
};

const clamp = (q: number, stock?: number | null) =>
  typeof stock === "number" && stock >= 0 ? Math.min(q, stock) : q;

export const useCart = create<CartState>((set) => ({
  items: [],
  opened: false,
  open: () => set({ opened: true }),
  close: () => set({ opened: false }),

  add: (item) =>
    set((s) => {
      const ml = item.ml ?? null;
      const lineId = item.variantId ?? item.productId ?? `${item.name}`;
      const idx = s.items.findIndex((i) => i.id === lineId && i.ml === ml);
      const addQty = item.qty ?? 1;
      const incomingStock = typeof item.stock === "number" ? item.stock : undefined;

      if (idx >= 0) {
        const prev = s.items[idx];
        const mergedStock = (incomingStock ?? prev.stock) as number | undefined;
        const nextQty = clamp(prev.qty + addQty, mergedStock);
        if (nextQty === prev.qty) return { items: s.items };
        const next = [...s.items];
        next[idx] = { ...prev, qty: nextQty, stock: mergedStock };
        return { items: next };
      }

      const qty = clamp(addQty, incomingStock);
      return {
        items: [
          ...s.items,
          {
            id: lineId,
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            brand: item.brand,
            ml,
            price: item.price,
            image: item.image ?? null,
            stock: incomingStock,
            qty,
          },
        ],
      };
    }),

  remove: (id, ml = null) =>
    set((s) => ({ items: s.items.filter((i) => !(i.id === id && i.ml === ml)) })),

  clear: () => set({ items: [] }),

  inc: (id, ml = null) =>
    set((s) => {
      const next = s.items.map((i) => {
        if (i.id !== id || i.ml !== ml) return i;
        const q = clamp(i.qty + 1, i.stock);
        return q === i.qty ? i : { ...i, qty: q };
      });
      return { items: next };
    }),

  dec: (id, ml = null) =>
    set((s) => {
      const next = s.items.map((i) =>
        i.id === id && i.ml === ml ? { ...i, qty: Math.max(1, i.qty - 1) } : i
      );
      return { items: next };
    }),

  setQty: (id, ml, qty) =>
    set((s) => {
      const next = s.items.map((i) => {
        if (i.id !== id || i.ml !== (ml ?? null)) return i;
        const q = clamp(Math.max(1, qty), i.stock);
        return { ...i, qty: q };
      });
      return { items: next };
    }),
}));
