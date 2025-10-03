// src/store/useCart.ts
"use client";
import { create } from "zustand";

export type CartItem = {
  id: string;                // = variantId || productId
  productId: string;
  variantId?: string;
  name: string;
  brand: string;
  ml: number | null;
  price: number;
  qty: number;
  image?: string | null;
  stock: number;             // stock visible para clamp
};

type AddInput = Omit<CartItem, "id" | "qty"> & { qty?: number };

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (i: AddInput) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  clear: () => void;
};

const clamp = (q: number, stock?: number | null) =>
  typeof stock === "number" && stock >= 0 ? Math.min(q, stock) : q;

export const useCart = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  add: (i) => {
    const key = i.variantId ?? i.productId;
    const addQty = i.qty ?? 1;
    set((s) => {
      const idx = s.items.findIndex((x) => x.id === key);
      if (idx >= 0) {
        const prev = s.items[idx];
        const mergedStock = (typeof i.stock === "number" ? i.stock : undefined) ?? prev.stock;
        const nextQty = clamp(prev.qty + addQty, mergedStock);
        if (nextQty === prev.qty) return { items: s.items, isOpen: true };
        const next = [...s.items];
        next[idx] = { ...prev, qty: nextQty, stock: mergedStock };
        return { items: next, isOpen: true };
      }
      const qty = clamp(addQty, i.stock);
      return {
        items: [
          ...s.items,
          {
            id: key,
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            brand: i.brand,
            ml: i.ml ?? null,
            price: i.price,
            qty,
            image: i.image ?? null,
            stock: i.stock,
          },
        ],
        isOpen: true,
      };
    });
  },

  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),

  setQty: (id, qty) =>
    set((s) => ({
      items: s.items.map((x) =>
        x.id === id ? { ...x, qty: clamp(Math.max(1, qty), x.stock) } : x
      ),
    })),

  inc: (id) =>
    set((s) => ({
      items: s.items.map((x) =>
        x.id === id ? { ...x, qty: clamp(x.qty + 1, x.stock) } : x
      ),
    })),

  dec: (id) =>
    set((s) => ({
      items: s.items.map((x) =>
        x.id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x
      ),
    })),

  clear: () => set({ items: [] }),
}));
