import type { ProductSize } from "@prisma/client";

export interface CartLineItem {
  /** Stable identifier = variantId. Multiple lines never share the same key. */
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  size: ProductSize;
  color: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
}

export interface CartState {
  isOpen: boolean;
  items: CartLineItem[];
}

export interface CartActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (item: CartLineItem) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  increment: (variantId: string) => void;
  decrement: (variantId: string) => void;
  clear: () => void;
}

export type CartStore = CartState & CartActions;
