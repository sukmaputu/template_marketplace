import {
  Building2,
  MapPin,
  Package,
  ShieldCheck,
  Store as StoreIcon,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { useCart } from "@/components/useCart";
import { useLocation } from "react-router-dom";

function formatRupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

export default function CheckoutPage() {
  const location = useLocation();
  const { items } = useCart();

  const immediateBuy = location.state?.immediateBuy as
    | {
        product: {
          id: string | number;
          name: string;
          price: number;
          image?: string;
          storeName?: string;
          storeId?: string;
          description?: string;
          originalPrice?: number;
          discountPercent?: number;
        };
        quantity: number;
      }
    | undefined;

  const selectedItems = immediateBuy
    ? [
        {
          id: immediateBuy.product.id,
          storeId: immediateBuy.product.storeId ?? "store-default",
          storeName: immediateBuy.product.storeName ?? "Toko Default",
          name: immediateBuy.product.name,
          variant: "Varian standar",
          image: immediateBuy.product.image,
          price: immediateBuy.product.price,
          originalPrice: immediateBuy.product.originalPrice,
          discountPercent: immediateBuy.product.discountPercent,
          quantity: immediateBuy.quantity,
          selected: true,
        },
      ]
    : items.filter((item) => item.selected);

  const shippingCost = 8000;
  const protectionCost = 8600;
  const insuranceCost = 1100;
  const totalHarga = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalTagihan =
    totalHarga + shippingCost + protectionCost + insuranceCost;

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-text">Checkout</h1>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Alamat Pengiriman
              </h2>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-text">
                    <MapPin className="h-4 w-4 text-primary" />
                    Rumah • I Putu Sukma Widyantara
                  </p>
                  <p className="mt-1.5 text-sm text-text-secondary">
                    Jln Slipi 11 RT 12 RW 03 Kelurahan Slipi Kecamatan Palmerah
                    Jakarta Barat (SDN 15 Pagi), Palmerah, Jakarta Barat, DKI
                    Jakarta, 6281586546312
                  </p>
                </div>
                <button className="shrink-0 rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-text hover:border-primary">
                  Ganti
                </button>
              </div>
            </div>

            {selectedItems.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-5 text-sm text-text-secondary">
                Belum ada produk yang dipilih untuk checkout.
              </div>
            ) : (
              selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-2">
                    <StoreIcon className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-bold text-text">
                      {item.storeName}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-text-secondary" />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-text">
                          {item.name}
                        </p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {item.variant}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-text">
                        {item.quantity} x {formatRupiah(item.price)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-border p-4 text-sm text-text-secondary">
                    <div className="flex items-center justify-between">
                      <span>Pengiriman Reguler</span>
                      <span>{formatRupiah(shippingCost)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Proteksi Rusak Total 3 Bulan</span>
                      <span>{formatRupiah(protectionCost)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Asuransi Pengiriman</span>
                      <span>{formatRupiah(insuranceCost)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:sticky lg:top-6 lg:h-fit">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text">
                  Metode Pembayaran
                </h2>
                <button className="text-sm font-medium text-primary hover:opacity-80">
                  Lihat Semua
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {[
                  "BCA Virtual Account",
                  "BRI Virtual Account",
                  "Alfamart / Alfamidi / Lawson / Dan+Dan",
                ].map((method) => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-3 py-3 text-sm text-text">
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-background">
                        <Building2 className="h-4 w-4 text-text-secondary" />
                      </span>
                      {method}
                    </span>
                    <input
                      type="radio"
                      name="payment-method"
                      className="h-4 w-4 accent-primary"
                      defaultChecked={method === "BCA Virtual Account"}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text">
                Ringkasan Transaksi
              </h3>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between text-text-secondary">
                  <span>
                    Total Harga (
                    {selectedItems.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    )}{" "}
                    Barang)
                  </span>
                  <span>{formatRupiah(totalHarga)}</span>
                </div>
                <div className="flex items-center justify-between text-text-secondary">
                  <span>Ongkos Kirim</span>
                  <span>{formatRupiah(shippingCost)}</span>
                </div>
                <div className="flex items-center justify-between text-text-secondary">
                  <span>Proteksi &amp; Asuransi</span>
                  <span>{formatRupiah(protectionCost + insuranceCost)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-medium text-text">
                  Total Tagihan
                </span>
                <span className="text-lg font-bold text-text">
                  {formatRupiah(totalTagihan)}
                </span>
              </div>

              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white hover:opacity-90">
                <ShieldCheck className="h-4 w-4" />
                Bayar Sekarang
              </button>

              <p className="mt-3 text-center text-xs text-text-secondary">
                Dengan melanjutkan pembayaran, kamu menyetujui{" "}
                <a href="#" className="underline hover:text-primary">
                  S&amp;K Asuransi Pengiriman &amp; Proteksi
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
