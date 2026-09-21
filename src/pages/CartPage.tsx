import { useEffect, useState } from "react";
import { Minus, Package, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/components/cart/useCart";
import { calculateCartSummary } from "@/lib/cart";
import { getDiscountPercent } from "@/lib/products";
import { api } from "@/lib/api";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    toggleSelectAll,
    toggleSelectItem,
  } = useCart();
  const { formatPrice } = useCurrency();
  const [liveStocks, setLiveStocks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;

    const uniqueIds = Array.from(new Set(items.map((i) => i.productId)));
    Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const res = await api.get(`/ecommerce/products/${id}`);
          return { id, stock: res.data?.data?.stock as number | undefined };
        } catch {
          return { id, stock: undefined };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, number> = {};
      for (const r of results) {
        if (typeof r.stock === "number") {
          map[r.id] = r.stock;
        }
      }
      setLiveStocks(map);
    });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const getItemStock = (item: (typeof items)[number]) => {
    return liveStocks[item.productId] ?? item.stock;
  };

  const allSelected = items.length > 0 && items.every((item) => item.selected);
  const selectedItems = items.filter((item) => item.selected);
  const summary = calculateCartSummary(items);

  const isAnySelectedOutOfStock = selectedItems.some((item) => {
    const stock = getItemStock(item);
    return stock !== undefined && stock <= 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-text">Keranjang</h1>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {items.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background">
                  <ShoppingCart className="h-8 w-8 text-text-secondary" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-text">
                  Keranjang kamu kosong
                </h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Belum ada barang yang kamu pilih. Silakan pilih produk dari
                  katalog.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                  Lanjut Belanja
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-text">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleSelectAll()}
                      className="h-5 w-5 rounded accent-primary"
                    />
                    Pilih Semua{" "}
                    <span className="text-text-primary">({items.length})</span>
                  </label>
                </div>

                <div className="divide-y divide-border">
                  {items.map((item) => {
                    const discount = getDiscountPercent(item);
                    const stock = getItemStock(item);
                    const isOutOfStock = stock !== undefined && stock <= 0;
                    const isMaxStock =
                      stock !== undefined &&
                      stock > 0 &&
                      item.quantity >= stock;

                    return (
                      <div
                        key={item.id}
                        className={`p-5 ${isOutOfStock ? "opacity-60 grayscale-[50%]" : ""}`}>
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            disabled={isOutOfStock}
                            onChange={() => toggleSelectItem(item.id)}
                            className="mt-1 h-5 w-5 shrink-0 rounded accent-primary disabled:cursor-not-allowed"
                          />

                          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-background">
                            {isOutOfStock ? (
                              <span className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 text-[10px] font-bold tracking-wider text-text backdrop-blur-[1px]">
                                SOLD OUT
                              </span>
                            ) : discount ? (
                              <span className="absolute left-0 top-0 z-10 rounded-br-md bg-red-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                                -{discount}%
                              </span>
                            ) : null}
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-8 w-8 text-text-secondary" />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text">
                                {item.name}
                              </p>
                              <p className="mt-1 text-sm text-text-secondary">
                                {item.variant}
                              </p>
                              {isOutOfStock ? (
                                <p className="mt-1 text-xs font-semibold text-red-600">
                                  Stok habis
                                </p>
                              ) : stock !== undefined && stock <= 5 ? (
                                <p className="mt-1 text-xs font-medium text-orange-600">
                                  Sisa {stock} buah
                                </p>
                              ) : null}
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                              <p className="text-base font-bold text-text">
                                {formatPrice(item.basePrice)}
                              </p>
                              {item.comparePrice &&
                              item.comparePrice > item.basePrice ? (
                                <p className="text-sm text-text-secondary line-through">
                                  {formatPrice(item.comparePrice)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-4">
                          <button
                            aria-label="Hapus item"
                            onClick={() => removeItem(item.id)}
                            className="text-text-secondary hover:text-red-600">
                            <Trash2 className="h-5 w-5" />
                          </button>

                          <div className="flex items-center rounded-full border border-border">
                            <button
                              aria-label="Kurangi jumlah"
                              disabled={isOutOfStock || item.quantity <= 1}
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-2 text-text hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium text-text">
                              {item.quantity}
                            </span>
                            <button
                              aria-label="Tambah jumlah"
                              disabled={isOutOfStock || isMaxStock}
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-2 text-text hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-6 lg:h-fit">
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-base font-semibold text-text">
                Ringkasan belanja
              </h2>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-text-secondary">Total Tagihan</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(summary.totalPrice)}
                </span>
              </div>

              {isAnySelectedOutOfStock && (
                <div className="mt-3 text-xs font-medium text-red-600">
                  Ada produk yang habis, harap batalkan pilihannya.
                </div>
              )}

              <button
                disabled={selectedItems.length === 0 || isAnySelectedOutOfStock}
                onClick={() => navigate("/checkout")}
                className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                {isAnySelectedOutOfStock
                  ? "Ada Produk Habis"
                  : `Beli (${summary.totalItems})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
