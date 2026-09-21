import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import type { WishlistItem } from "@/components/profile/types";
import { getDiscountPercent } from "@/lib/products";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";
import { useCart } from "@/components/cart/useCart";

const WISHLIST_STORAGE_KEY = "marketplace-wishlist";
const ITEMS_PER_PAGE = 6;

function getStoredWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved) as WishlistItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistTab() {
  const [items, setItems] = useState<WishlistItem[]>(() => getStoredWishlist());
  const [page, setPage] = useState(1);
  const isLoading = false;

  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleAddToCart(item: WishlistItem) {
    if (item.product.variants?.length) {
      navigate(`/product/${item.product.id}`);
      return;
    }

    addToCart(item.product, 1);
    navigate("/cart"); // hapus kalau mau tetap di wishlist
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
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {pagedItems.map((item) => {
              const { product } = item;
              const discountPercent = getDiscountPercent(product);
              const stock = product.stock;
              const inStock = stock === undefined || stock > 0;
              const detailHref = `/product/${product.id}`;

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

                  <Link
                    to={detailHref}
                    className="flex aspect-square items-center justify-center bg-background">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Heart className="h-6 w-6 text-text-secondary" />
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <Link to={detailHref}>
                      <p className="line-clamp-2 text-xs font-medium text-text hover:text-primary">
                        {product.name}
                      </p>
                    </Link>

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
                      {inStock
                        ? product.variants?.length
                          ? "Pilih Varian"
                          : "Tambah ke Keranjang"
                        : "Stok Habis"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination wishlist"
              className="mt-6 flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Halaman sebelumnya"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => goToPage(n)}
                  aria-current={n === currentPage ? "page" : undefined}
                  className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-medium transition-colors ${
                    n === currentPage
                      ? "border-primary bg-primary text-white"
                      : "border-border text-text hover:bg-background"
                  }`}>
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Halaman berikutnya"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
