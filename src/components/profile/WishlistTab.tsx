import { useEffect, useState } from "react";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import type { WishlistItem } from "@/components/profile/types";
import { PRODUCTS, getDiscountPercent } from "@/lib/products";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";

const WISHLIST_STORAGE_KEY = "marketplace-wishlist";

const DUMMY_WISHLIST: WishlistItem[] = [
  { id: "w1", product: PRODUCTS[0] },
  { id: "w2", product: PRODUCTS[2] },
  { id: "w3", product: PRODUCTS[8] },
];

function getStoredWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return DUMMY_WISHLIST;

  try {
    const saved = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!saved) return DUMMY_WISHLIST;

    const parsed = JSON.parse(saved) as WishlistItem[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DUMMY_WISHLIST;
  } catch {
    return DUMMY_WISHLIST;
  }
}

export function WishlistTab() {
  const [items, setItems] = useState<WishlistItem[]>(() => getStoredWishlist());
  const isLoading = false;
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleAddToCart(item: WishlistItem) {
    console.log("add to cart", item.product.id);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-text">Wishlist</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Produk yang kamu simpan untuk dibeli nanti.
      </p>

      {isLoading && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg border border-border bg-background"
            />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Heart className="h-8 w-8 text-text-secondary" />
          <p className="text-sm text-text-secondary">
            Belum ada produk di wishlist kamu.
          </p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item) => {
            const { product } = item;
            const discountPercent = getDiscountPercent(product);
            const inStock = product.stock === undefined || product.stock > 0;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  aria-label="Hapus dari wishlist"
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-text-secondary shadow-sm hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {discountPercent !== undefined && (
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-white">
                    -{discountPercent}%
                  </span>
                )}

                <div className="flex aspect-square items-center justify-center bg-background">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Heart className="h-6 w-6 text-text-secondary" />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="line-clamp-2 text-xs font-medium text-text">
                    {product.name}
                  </p>

                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(product.basePrice)}
                    </p>
                    {product.comparePrice && (
                      <p className="text-xs text-text-secondary line-through">
                        {formatPrice(product.comparePrice)}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!inStock}
                    onClick={() => handleAddToCart(item)}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-background disabled:text-text-secondary">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {inStock ? "Tambah ke Keranjang" : "Stok Habis"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
