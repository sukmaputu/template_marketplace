import { useState, type FormEvent, useEffect } from "react";
import {
  Building2,
  CalendarClock,
  Clock,
  MapPin,
  Package,
  ShieldCheck,
  Star,
  Truck,
  Zap,
  Loader2,
  Ticket,
  ChevronRight,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { useCart } from "@/components/cart/useCart";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/UseAuth";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";
import type { Voucher } from "@/components/profile/types"; // Import type voucher
import {
  LOYALTY_REWARD_THRESHOLD,
  LOYALTY_REWARD_VOUCHER,
} from "@/lib/vouchers";

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

// Dummy Data Voucher untuk pilihan
const DUMMY_VOUCHERS: Voucher[] = [
  {
    id: "1",
    code: "NEWUSER20",
    title: "Diskon Pengguna Baru",
    discount_label: "20% OFF",
    min_purchase_amount: 100000,
    min_purchase: "Min. belanja Rp 100.000",
    expires_at: "31 Des 2026",
    status: "aktif",
  },
  {
    id: "2",
    code: "ONGKIR0",
    title: "Gratis Ongkir",
    discount_label: "Rp 15.000",
    discount_amount: 15000,
    min_purchase_amount: 50000,
    min_purchase: "Min. belanja Rp 50.000",
    expires_at: "15 Sep 2026",
    status: "aktif",
  },
];

const LOYALTY_POINTS_PER_TRANSACTION = 10;

function parseEtaDays(eta: string): { min: number; max: number } {
  const match = eta.match(/(\d+)(?:-(\d+))?/);
  if (!match) return { min: 1, max: 1 };
  const min = Number(match[1]);
  const max = match[2] ? Number(match[2]) : min;
  return { min, max };
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getEstimatedDeliveryLabel(eta: string) {
  const { min, max } = parseEtaDays(eta);
  const today = new Date();
  const from = addDays(today, min);
  const to = addDays(today, max);
  return min === max
    ? formatShortDate(from)
    : `${formatShortDate(from)} - ${formatShortDate(to)}`;
}

interface FormErrors {
  postalCode?: string;
  city?: string;
}

interface CheckoutItem {
  id: string;
  productId: string;
  name: string;
  variant: string;
  image?: string;
  basePrice: number;
  comparePrice?: number;
  quantity: number;
  selected: true;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  const { items, clearSelected } = useCart();

  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState(
    "Jl. Contoh Alamat No. 123, Jakarta Selatan",
  );
  const [isSearchingZip, setIsSearchingZip] = useState(false);
  const [shippingMethodId, setShippingMethodId] =
    useState<ShippingMethod["id"]>("standard");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [voucherError, setVoucherError] = useState("");

  const availableVouchers =
    (user?.loyalty_points ?? 0) >= LOYALTY_REWARD_THRESHOLD
      ? [...DUMMY_VOUCHERS, LOYALTY_REWARD_VOUCHER]
      : DUMMY_VOUCHERS;

  function applyVoucherCode() {
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) {
      setVoucherError("Masukkan kode voucher.");
      return;
    }
    const found = availableVouchers.find(
      (v) => v.code.toUpperCase() === code && v.status === "aktif",
    );
    if (!found) {
      setVoucherError("Kode voucher tidak valid atau sudah kedaluwarsa.");
      return;
    }
    setSelectedVoucher(found);
    setVoucherError("");
    setVoucherCodeInput("");
    setShowVoucherList(false);
  }

  useEffect(() => {
    const fetchCity = async () => {
      if (/^\d{5}$/.test(postalCode)) {
        setIsSearchingZip(true);
        try {
          const response = await fetch(
            `https://kodepos.vercel.app/search/?q=${postalCode}`,
          );
          const result = await response.json();

          if (result.data && result.data.length > 0) {
            setCity(result.data[0].regency);
            setFormErrors((prev) => ({ ...prev, city: undefined }));
          }
        } catch (error) {
          console.error("Gagal mengambil data kode pos:", error);
        } finally {
          setIsSearchingZip(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchCity, 500);
    return () => clearTimeout(debounceTimer);
  }, [postalCode]);

  const shippingMethod =
    SHIPPING_METHODS.find((m) => m.id === shippingMethodId) ??
    SHIPPING_METHODS[0];
  const shippingCost = shippingMethod.cost;
  const estimatedDeliveryLabel = getEstimatedDeliveryLabel(shippingMethod.eta);

  const immediateBuy = location.state?.immediateBuy as
    | {
        product: {
          id: string;
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

  const selectedItems: CheckoutItem[] = immediateBuy
    ? [
        {
          id: immediateBuy.product.id,
          productId: immediateBuy.product.id,
          name: immediateBuy.product.name,
          variant: immediateBuy.variant ?? "Varian standar",
          image: immediateBuy.product.image,
          basePrice: immediateBuy.product.basePrice,
          comparePrice: immediateBuy.product.comparePrice,
          quantity: immediateBuy.quantity,
          selected: true,
        },
      ]
    : items
        .filter((item) => item.selected)
        .map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          variant: item.variant,
          image: item.image,
          basePrice: item.basePrice,
          comparePrice: item.comparePrice,
          quantity: item.quantity,
          selected: true as const,
        }));

  const protectionCost = 8600;
  const insuranceCost = 1100;

  const totalHarga = selectedItems.reduce(
    (sum, item) => sum + item.basePrice * item.quantity,
    0,
  );

  const discountAmount = selectedVoucher
    ? selectedVoucher.code === "NEWUSER20"
      ? totalHarga * 0.2
      : (selectedVoucher.discount_amount ?? 0)
    : 0;

  const totalTagihan =
    totalHarga + shippingCost + protectionCost + insuranceCost - discountAmount;

  const loyaltyPointsEarned = LOYALTY_POINTS_PER_TRANSACTION;

  const deliverToLabel = [address.trim(), city.trim(), postalCode.trim()]
    .filter(Boolean)
    .join(", ");

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

    const purchasedProductIds = selectedItems.map((item) => item.productId);

    if (!immediateBuy) {
      clearSelected();
    }

    navigate("/payment-success", {
      state: {
        totalPaid: totalTagihan,
        itemIds: purchasedProductIds,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          variant: item.variant,
          quantity: item.quantity,
          price: item.basePrice,
          image: item.image,
        })),
        subtotal: totalHarga,
        packagingFee: shippingCost,
        discountAmount,
        voucherCode: selectedVoucher?.code,
        loyaltyPointsEarned,
        estimatedDeliveryLabel,
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
                      Kode Pos <span className="text-red-600">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Contoh: 12210"
                        className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary ${
                          formErrors.postalCode
                            ? "border-red-500"
                            : "border-border"
                        }`}
                      />
                      {isSearchingZip && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
                      )}
                    </div>
                    {formErrors.postalCode && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.postalCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text">
                      Kota <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Terisi otomatis..."
                      className={`mt-1.5 w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary ${
                        formErrors.city ? "border-red-500" : "border-border"
                      }`}
                    />
                    {formErrors.city && (
                      <p className="mt-1 text-xs text-red-500">
                        {formErrors.city}
                      </p>
                    )}
                  </div>
                </div>

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
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Voucher
                </h2>
                <div className="mt-3">
                  {!showVoucherList ? (
                    <button
                      type="button"
                      onClick={() => setShowVoucherList(true)}
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/50">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Ticket className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-text">
                            {selectedVoucher
                              ? selectedVoucher.title
                              : "Gunakan Voucher"}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {selectedVoucher
                              ? `Hemat ${
                                  selectedVoucher.discount_amount !== undefined
                                    ? formatPrice(
                                        selectedVoucher.discount_amount,
                                      )
                                    : selectedVoucher.discount_label
                                }`
                              : "Makin hemat pakai promo"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-text-secondary" />
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={voucherCodeInput}
                            onChange={(e) => {
                              setVoucherCodeInput(e.target.value);
                              if (voucherError) setVoucherError("");
                            }}
                            placeholder="Masukkan kode voucher"
                            className={`flex-1 rounded-lg border bg-background px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary ${
                              voucherError ? "border-red-500" : "border-border"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={applyVoucherCode}
                            className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                            Pakai
                          </button>
                        </div>
                        {voucherError && (
                          <p className="mt-1 text-xs text-red-500">
                            {voucherError}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <div className="h-px flex-1 bg-border" />
                        <span>atau pilih voucher</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      {availableVouchers
                        .filter((v) => v.status === "aktif")
                        .map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setSelectedVoucher(v);
                              setShowVoucherList(false);
                            }}
                            className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                              selectedVoucher?.id === v.id
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}>
                            <Ticket className="mt-1 h-4 w-4 text-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-text">
                                {v.title}
                              </p>
                              <p className="text-xs text-primary font-bold">
                                {v.discount_amount !== undefined
                                  ? formatPrice(v.discount_amount)
                                  : v.discount_label}
                              </p>
                              <p className="text-[10px] text-text-secondary">
                                {v.min_purchase_amount !== undefined
                                  ? `Min. belanja ${formatPrice(v.min_purchase_amount)}`
                                  : v.min_purchase}
                              </p>
                            </div>
                          </button>
                        ))}
                      <button
                        type="button"
                        onClick={() => {
                          setShowVoucherList(false);
                          setVoucherError("");
                          setVoucherCodeInput("");
                        }}
                        className="w-full py-2 text-xs font-medium text-text-secondary hover:text-primary">
                        Batal
                      </button>
                    </div>
                  )}
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
                              {formatPrice(method.cost)}
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

              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Detail Pengiriman
                </h2>

                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background border border-border">
                      <MapPin className="h-4 w-4 text-text-secondary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary">Dikirim ke</p>
                      <p className="text-sm font-medium text-text">
                        {deliverToLabel || "Lengkapi alamat di atas"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background border border-border">
                      <CalendarClock className="h-4 w-4 text-text-secondary" />
                    </span>
                    <div>
                      <p className="text-xs text-text-secondary">
                        Estimasi Tiba
                      </p>
                      <p className="text-sm font-medium text-text">
                        {estimatedDeliveryLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background border border-border">
                      <Star className="h-4 w-4 text-text-secondary" />
                    </span>
                    <div>
                      <p className="text-xs text-text-secondary">
                        Poin Loyalti yang Didapat
                      </p>
                      <p className="text-sm font-medium text-text">
                        +{loyaltyPointsEarned.toLocaleString("id-ID")} poin
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg bg-background p-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
                    <p className="text-xs text-text-secondary">
                      Pesanan dikirim dalam 24 jam setelah pembayaran
                      dikonfirmasi.
                    </p>
                  </div>
                </div>
              </div>

              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-surface p-5">
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
                        {item.quantity} x {formatPrice(item.basePrice)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-border p-4 text-sm text-text-secondary">
                    <div className="flex items-center justify-between">
                      <span>Pengiriman {shippingMethod.label}</span>
                      <span>{formatPrice(shippingCost)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>Proteksi & Asuransi</span>
                      <span>{formatPrice(protectionCost + insuranceCost)}</span>
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
                    <span>{formatPrice(totalHarga)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ongkos Kirim</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Proteksi & Asuransi</span>
                    <span>{formatPrice(protectionCost + insuranceCost)}</span>
                  </div>
                  {selectedVoucher && (
                    <div className="flex items-center justify-between text-primary font-medium">
                      <span>Diskon Voucher</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-text">
                    Total Tagihan
                  </span>
                  <span className="text-lg font-bold text-text">
                    {formatPrice(totalTagihan)}
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
