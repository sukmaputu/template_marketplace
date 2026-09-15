import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createCartItem, type CartItem } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { CartContext } from "@/components/cart/cartContext";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity = 1, variant?: string) => {
    if (product.stock !== undefined && product.stock <= 0) {
      return;
    }

    const resolvedVariant = variant ?? "Varian standar";
    const cartItemId = `${product.id}::${resolvedVariant}`;

    setItems((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) => {
          if (item.id !== cartItemId) return item;
          const maxQty = item.stock !== undefined && item.stock > 0 ? item.stock : 999;
          return {
            ...item,
            quantity: Math.min(item.quantity + quantity, maxQty),
          };
        });
      }
      return [...prev, createCartItem(product, quantity, resolvedVariant)];
    });
  };

  const updateQuantity = (id: CartItem["id"], delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const maxQty = item.stock !== undefined && item.stock > 0 ? item.stock : 999;
        const nextQty = Math.max(1, Math.min(item.quantity + delta, maxQty));
        return { ...item, quantity: nextQty };
      }),
    );
  };

  const removeItem = (id: CartItem["id"]) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearSelected = () => {
    setItems((prev) => prev.filter((item) => !item.selected));
  };

  const toggleSelectItem = (id: CartItem["id"]) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const toggleSelectAll = () => {
    setItems((prev) => {
      const hasUnselected = prev.some((item) => !item.selected);
      return prev.map((item) => ({ ...item, selected: hasUnselected }));
    });
  };

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      addToCart,
      updateQuantity,
      removeItem,
      clearSelected,
      toggleSelectItem,
      toggleSelectAll,
      itemCount,
    }),
    [items, itemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
