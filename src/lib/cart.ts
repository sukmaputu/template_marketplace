import type { Product } from "./products";

export interface CartItem {
  id: string | number;
  storeId: string;
  storeName: string;
  name: string;
  variant: string;
  image?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
  selected: boolean;
  categoryId?: string;
}

export interface CartSummary {
  totalPrice: number;
  totalItems: number;
  selectedCount: number;
}

export function createCartItem(
  product: Product & {
    quantity?: number;
    selected?: boolean;
    variant?: string;
  },
): CartItem {
  return {
    id: product.id,
    storeId: product.storeId ?? "store-default",
    storeName: product.storeName ?? "Toko Default",
    name: product.name,
    variant: product.variant ?? "Varian standar",
    image: product.image,
    price: product.price,
    originalPrice: product.originalPrice,
    discountPercent: product.discountPercent,
    quantity: product.quantity ?? 1,
    selected: product.selected ?? true,
    categoryId: product.categoryId,
  };
}

export function calculateCartSummary(items: CartItem[]): CartSummary {
  const selectedItems = items.filter((item) => item.selected);
  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalItems = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return {
    totalPrice,
    totalItems,
    selectedCount: selectedItems.length,
  };
}
