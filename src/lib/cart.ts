import type { Product, ProductType } from "./products";

export interface CartItem {
  id: string | number;
  name: string;
  type: ProductType;
  variant: string;
  image?: string;
  basePrice: number;
  comparePrice?: number;
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
  product: Product,
  quantity: number = 1,
  variantName: string = "Varian standar",
): CartItem {
  const cartItemId = `${product.id}::${variantName}`;

  return {
    id: cartItemId,
    name: product.name,
    type: product.type,
    variant: variantName,
    image: product.image,
    basePrice: product.basePrice,
    comparePrice: product.comparePrice,
    quantity: quantity,
    selected: true,
    categoryId: product.categoryId,
  };
}

export function calculateCartSummary(items: CartItem[]): CartSummary {
  const selectedItems = items.filter((item) => item.selected);

  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + item.basePrice * item.quantity,
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
