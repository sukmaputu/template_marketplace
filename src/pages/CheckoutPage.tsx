import { useState, type FormEvent } from "react";
import {
  Building2,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { useCart } from "@/components/cart/useCart";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/UseAuth";

function formatRupiah(value: number) {
  return `Rp${(value || 0).toLocaleString("id-ID")}`;
}

interface ShippingMethod {
  id: "standard" | "express";
  label: string;
  eta: string;
  cost: number;
}

const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "standard", label: "Standard", eta: "3-5 hari kerja", cost: 8000 },
  { id: "express", label: "Express", eta: "1-2 hari kerja", cost: 25000 },
];

interface FormErrors {
  postalCode?: string;
  city?: string;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { items, clearSelected } = useCart();

  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [shippingMethodId, setShippingMethodId] =
    useState<ShippingMethod["id"]>("standard");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const shippingMethod =
    SHIPPING_METHODS.find((m) => m.id === shippingMethodId) ??
    SHIPPING_METHODS[0];
  const shippingCost = shippingMethod.cost;

  const immediateBuy = location.state?.immediateBuy as
    | {
        product: {
          id: string | number;
          name: string;
          basePrice: number;
          image?: string;
          description?: string;
          comparePrice?: number;
        };
        quantity: number;
        variant?: string;
      }
    | undefined;

  const selectedItems = immediateBuy
    ? [
        {
          id: immediateBuy.product.id,
          name: immediateBuy.product.name,
          variant: immediateBuy.variant ?? "Varian standar",
          image: immediateBuy.product.image,
          basePrice: immediateBuy.product.basePrice,
          comparePrice: immediateBuy.product.comparePrice,
          quantity: immediateBuy.quantity,
          selected: true,
        },
      ]
    : items.filter((item) => item.selected);

  const protectionCost = 8600;
  const insuranceCost = 1100;

  const totalHarga = selectedItems.reduce(
    (sum, item) => sum + item.basePrice * item.quantity,
    0,
  );

  const totalTagihan =
    totalHarga + shippingCost + protectionCost + insuranceCost;

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!city.trim()) nextErrors.city = "Kota wajib diisi.";
    if (!postalCode.trim()) {
      nextErrors.postalCode = "Kode pos wajib diisi.";
    } else if (!/^\d{5}$/.test(postalCode.trim())) {
      nextErrors.postalCode = "Kode pos harus 5 digit angka.";
    }
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleBayarSekarang(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const purchasedProductIds = selectedItems.map((item) =>
      typeof item.id === "string" && item.id.includes("::")
        ? item.id.split("::")[0]
        : item.id,
    );

    if (!immediateBuy) {
      clearSelected();
    }

    navigate("/payment-success", {
      state: {
        totalPaid: totalTagihan,
        itemIds: purchasedProductIds,
        items: selectedItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.basePrice,
        })),
        subtotal: totalHarga,
        packagingFee: shippingCost,
        customer: {
          name: user?.full_name || "Pelanggan",
          email: user?.email || "",
          phone: "+62 812 3456 7890",
        },
      },
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <form onSubmit={handleBayarSekarang}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-text">Checkout</h1>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Alamat Pengiriman
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Nama, no. telepon, dan alamat otomatis terisi dari akun kamu.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-text">
                      Nama Penerima
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.full_name}
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text">
                      No. Telepon
                    </label>
                    <input
                      type="tel"
                      defaultValue="+62 812 3456 7890"
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-text">
                    Alamat Rumah
                  </label>
                  <textarea
                    rows={2}
                    defaultValue="Jl. Contoh Alamat No. 123, Jakarta Selatan"
                    className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-text">
                      Kota <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Contoh: Jakarta Selatan"
                      className={`mt-1.5 w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary ${
                        formErrors.city ? "border-red-500" : "border-border"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text">
                      Kode Pos <span className="text-red-600">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Contoh: 12210"
                        className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary ${
                          formErrors.postalCode
                            ? "border-red-500"
                            : "border-border"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Metode Pengiriman <span className="text-red-600">*</span>
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SHIPPING_METHODS.map((method) => {
                    const Icon = method.id === "express" ? Zap : Truck;
                    const isSelected = shippingMethodId === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setShippingMethodId(method.id)}
                        className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}>
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isSelected ? "bg-primary text-white" : "bg-background text-text-secondary"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-text">
                              {method.label}
                            </span>
                            <span className="text-sm font-semibold text-text">
                              {formatRupiah(method.cost)}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs text-text-secondary">
                            Estimasi {method.eta}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-surface p-5">
                  {/* Bagian Store dihapus sesuai instruksi BE */}
                  <div className="flex gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background border border-border">
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
                        {item.quantity} x {formatRupiah(item.basePrice)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-border p-4 text-sm text-text-secondary">
                    <div className="flex items-center justify-between">
                      <span>Pengiriman {shippingMethod.label}</span>
                      <span>{formatRupiah(shippingCost)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Proteksi & Asuransi</span>
                      <span>
                        {formatRupiah(protectionCost + insuranceCost)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-6 lg:h-fit">
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text">
                    Metode Pembayaran
                  </h2>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:opacity-80">
                    Lihat Semua
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    "BCA Virtual Account",
                    "BRI Virtual Account",
                    "Alfamart",
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

              <div className="mt-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-text">
                  Ringkasan Transaksi
                </h3>
                <div className="mt-3 space-y-2 text-sm text-text-secondary">
                  <div className="flex items-center justify-between">
                    <span>Total Harga ({selectedItems.length} Barang)</span>
                    <span>{formatRupiah(totalHarga)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ongkos Kirim</span>
                    <span>{formatRupiah(shippingCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Proteksi & Asuransi</span>
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
                <button
                  type="submit"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white hover:opacity-90">
                  <ShieldCheck className="h-4 w-4" />
                  Bayar Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
