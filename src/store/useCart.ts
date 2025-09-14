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
    stock?: number; // ← tope disponible (opcional)

};

type CartState = {
  items: CartItem[];
  opened: boolean;
  open: () => void;
  close: () => void;
  add: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  remove: (id: string, ml?: number | null) => void;
  clear: () => void;
  inc: (id: string, ml?: number | null) => void;
  dec: (id: string, ml?: number | null) => void;
  setQty: (id: string, ml: number | null | undefined, qty: number) => void;
};

const clamp = (q: number, stock?: number|null) =>
  typeof stock === "number" && stock >= 0 ? Math.min(q, stock) : q;

export const useCart = create<CartState>((set) => ({
  items: [],
  opened: false,
  open: () => set({ opened: true }),
  close: () => set({ opened: false }),

  add: (item) =>
  set((s) => {
    const ml = item.ml ?? null;
    const idx = s.items.findIndex((i) => i.id === item.id && i.ml === ml);
    const addQty = item.qty ?? 1;
    if (idx >= 0) {
      const prev = s.items[idx];
      // usa el stock más confiable: el que venga ahora o el que ya tenía
      const mergedStock = (typeof item.stock === "number" ? item.stock : undefined) ?? prev.stock;
      const nextQty = clamp(prev.qty + addQty, mergedStock);
      // si no cambia, no agregues más
      if (nextQty === prev.qty) return { items: s.items };
      const next = [...s.items];
      next[idx] = { ...prev, qty: nextQty, stock: mergedStock };
      return { items: next };
    }
        const stock = typeof item.stock === "number" ? item.stock : undefined;


      // nuevo ítem: guarda stock si viene
      const qty = clamp(addQty, stock);
    return {
      items: [
        ...s.items,
        {
          id: item.id,
          name: item.name,
          brand: item.brand,
          ml,
          price: item.price,
          image: item.image,
          stock,
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
      const next = s.items
        .map((i) =>
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