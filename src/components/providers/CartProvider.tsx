"use client";

import { useEffect, type ReactNode } from "react";
import { useCartStore } from "@/features/cart/store/cartStore";

/**
 * Manually rehydrate the persisted cart store on the client.
 * Pairs with `skipHydration: true` in the store config — prevents SSR/CSR mismatch
 * (which would otherwise silently break hydration and disable all click handlers).
 */
export function CartProvider({ children }: { children: ReactNode }): React.ReactElement {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);
  return <>{children}</>;
}
