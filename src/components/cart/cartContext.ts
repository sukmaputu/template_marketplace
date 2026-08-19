import { createContext } from "react";
import type { CartItem } from "@/lib/cart";
import type { Product } from "@/lib/products";

export interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: string) => void;
  updateQuantity: (id: CartItem["id"], delta: number) => void;
  removeItem: (id: CartItem["id"]) => void;
  clearSelected: () => void;
  toggleSelectItem: (id: CartItem["id"]) => void;
  toggleSelectAll: () => void;
  itemCount: number;
}

export const CartContext = createContext<CartContextValue | null>(null);
