import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createCartItem, type CartItem } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { CartContext } from "@/components/cartContext";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [
        ...prev,
        createCartItem({
          ...product,
          quantity,
          selected: true,
          variant: "Varian standar",
        }),
      ];
    });
  };

  const updateQuantity = (id: CartItem["id"], delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
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

  const toggleSelectStore = (storeId: string) => {
    setItems((prev) => {
      const storeItems = prev.filter((item) => item.storeId === storeId);
      const shouldSelect = storeItems.some((item) => !item.selected);
      return prev.map((item) =>
        item.storeId === storeId ? { ...item, selected: shouldSelect } : item,
      );
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
      toggleSelectStore,
      itemCount,
    }),
    [items, itemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
