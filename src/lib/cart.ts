import {
  getVariantPrice,
  type Product,
  type ProductType,
} from "./products";

export interface CartItem {
  id: string;
  backendCartItemId?: string;
  productId: string;
  variantUuid?: string;
  name: string;
  type: ProductType;
  variant: string;
  image?: string;
  basePrice: number;
  comparePrice?: number;
  quantity: number;
  selected: boolean;
  categoryId?: string;
  stock?: number;
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
  variantUuid?: string,
): CartItem {
  const cartItemId = `${product.id}::${variantName}`;
  const selectedVariant =
    product.variants?.find((variant) => variant.id === variantUuid) ??
    product.variants?.find((variant) => variant.variantName === variantName);
  const availableStock = selectedVariant?.stock ?? product.stock;

  return {
    id: cartItemId,
    productId: product.id,
    variantUuid: selectedVariant?.id,
    name: product.name,
    type: product.type,
    variant: variantName,
    image: product.image,
    basePrice: getVariantPrice(product, selectedVariant),
    comparePrice: product.comparePrice,
    quantity: quantity,
    selected: !(availableStock !== undefined && availableStock <= 0),
    categoryId: product.categoryId,
    stock: availableStock,
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
