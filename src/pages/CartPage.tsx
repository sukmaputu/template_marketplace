import {
  Heart,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/components/useCart";
import { calculateCartSummary, type CartItem } from "@/lib/cart";

function formatRupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearSelected,
    toggleSelectAll,
    toggleSelectStore,
    toggleSelectItem,
  } = useCart();
  const allSelected = items.length > 0 && items.every((item) => item.selected);
  const selectedItems = items.filter((item) => item.selected);
  const summary = calculateCartSummary(items);

  const storeGroups = items.reduce<
    { storeId: string; storeName: string; items: CartItem[] }[]
  >((groups, item) => {
    const group = groups.find((g) => g.storeId === item.storeId);
    if (group) {
      group.items.push(item);
    } else {
      groups.push({
        storeId: item.storeId,
        storeName: item.storeName,
        items: [item],
      });
    }
    return groups;
  }, []);

  function removeSelected() {
    clearSelected();
  }

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
                  <button
                    onClick={removeSelected}
                    disabled={selectedItems.length === 0}
                    className="text-sm font-medium text-primary hover:opacity-80 disabled:opacity-40">
                    Hapus
                  </button>
                </div>

                {storeGroups.map((group) => {
                  const allStoreSelected = group.items.every(
                    (item) => item.selected,
                  );

                  return (
                    <div
                      key={group.storeId}
                      className="border-b border-border last:border-0">
                      <div className="flex items-center gap-3 px-5 py-4">
                        <input
                          type="checkbox"
                          checked={allStoreSelected}
                          onChange={() => toggleSelectStore(group.storeId)}
                          className="h-5 w-5 rounded accent-primary"
                        />
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-text">
                          {group.storeName}
                        </span>
                      </div>

                      {group.items.map((item) => (
                        <div key={item.id} className="px-5 pb-5">
                          <div className="flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => toggleSelectItem(item.id)}
                              className="mt-1 h-5 w-5 shrink-0 rounded accent-primary"
                            />

                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-background">
                              {item.discountPercent ? (
                                <span className="absolute left-0 top-0 rounded-br-md bg-red-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                                  {item.discountPercent}%
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
                              </div>
                              <div className="shrink-0 text-left sm:text-right">
                                <p className="text-base font-bold text-text">
                                  {formatRupiah(item.price)}
                                </p>
                                {item.originalPrice ? (
                                  <p className="text-sm text-text-secondary line-through">
                                    {formatRupiah(item.originalPrice)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-end gap-4">
                            <button
                              aria-label="Simpan ke wishlist"
                              className="text-text-secondary hover:text-primary">
                              <Heart className="h-5 w-5" />
                            </button>
                            <button
                              aria-label="Hapus item"
                              onClick={() => removeItem(item.id)}
                              className="text-text-secondary hover:text-red-600">
                              <Trash2 className="h-5 w-5" />
                            </button>

                            <div className="flex items-center rounded-full border border-border">
                              <button
                                aria-label="Kurangi jumlah"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-2 text-text hover:text-primary">
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium text-text">
                                {item.quantity}
                              </span>
                              <button
                                aria-label="Tambah jumlah"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-2 text-text hover:text-primary">
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-6 lg:h-fit">
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-base font-semibold text-text">
                Ringkasan belanja
              </h2>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-text-secondary">Total</span>
                <span className="text-lg font-bold text-text">
                  {formatRupiah(summary.totalPrice)}
                </span>
              </div>

              <button
                disabled={selectedItems.length === 0}
                onClick={() => navigate("/checkout")}
                className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
                Beli ({summary.totalItems})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
