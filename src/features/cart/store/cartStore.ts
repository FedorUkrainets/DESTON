"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartLineItem, CartStore } from "../types/cart";

const MAX_QUANTITY_PER_LINE = 99;

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAX_QUANTITY_PER_LINE, Math.floor(value)));
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      isOpen: false,
      items: [],

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (incoming: CartLineItem) =>
        set((state) => {
          const idx = state.items.findIndex((i) => i.variantId === incoming.variantId);
          if (idx >= 0) {
            const next = [...state.items];
            const existing = next[idx];
            if (!existing) return state;
            next[idx] = {
              ...existing,
              quantity: clampQuantity(existing.quantity + incoming.quantity),
            };
            return { items: next, isOpen: true };
          }
          return {
            items: [...state.items, { ...incoming, quantity: clampQuantity(incoming.quantity) }],
            isOpen: true,
          };
        }),

      removeItem: (variantId: string) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: clampQuantity(quantity) } : i,
          ),
        })),

      increment: (variantId) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: clampQuantity(i.quantity + 1) } : i,
          ),
        })),

      decrement: (variantId) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.variantId === variantId ? { ...i, quantity: clampQuantity(i.quantity - 1) } : i,
            )
            .filter((i) => i.quantity > 0),
        })),

      clear: () => set({ items: [], isOpen: false }),
    }),
    {
      name: "deston-cart",
      version: 1,
      // Defer hydration until after mount to avoid SSR/CSR mismatches that
      // would otherwise abort React hydration and silently kill every click.
      skipHydration: true,
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : localStorage,
      ),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function selectSubtotal(state: CartStore): number {
  return state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

export function selectTotalCount(state: CartStore): number {
  return state.items.reduce((sum, i) => sum + i.quantity, 0);
}
