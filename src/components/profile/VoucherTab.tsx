import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { Plus, Ticket, Trophy, Sparkles, Loader2 } from "lucide-react";
import type {
  Voucher,
  VoucherStatus,
  ClaimableLoyaltyVoucher,
} from "@/components/profile/types";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";
import { useAuth } from "@/components/auth/UseAuth";
import Pagination from "@/components/ui/pagination";
import {
  CHECKOUT_VOUCHERS,
  LOYALTY_REWARD_THRESHOLD,
  LOYALTY_REWARD_VOUCHER,
} from "@/lib/vouchers";
import { showToast } from "@/lib/toast";
import { api } from "@/lib/api";
import { websocketService } from "@/lib/websocket";
import { useLoyalties } from "@/lib/loyalty";

interface ApiVoucher {
  uuid?: string;
  id?: string | number;
  code?: string;
  description?: string | null;
  voucher_type?: string;
  discount_value?: string | number | null;
  max_discount_amount?: string | number | null;
  min_purchase_amount?: string | number | null;
  valid_to_date?: string | null;
  target_type?: string;
}

interface ApiEnvelope<T> {
  data?: T;
}

interface ApiClaimableVoucher {
  is_claimed?: boolean;
  tier_name?: string;
  voucher?: ApiVoucher | null;
}

interface ApiWalletVoucher {
  uuid?: string;
  status?: string;
  voucher?: ApiVoucher | null;
}

interface ApiVoucherValidation {
  valid?: boolean;
  message?: string;
  voucher?: ApiVoucher | null;
}

const EXPIRED_VOUCHER: Voucher = {
  id: "3",
  code: "FLASH10",
  title: "Flash Sale Agustus",
  discount_label: "10% OFF",
  expires_at: "31 Agu 2026",
  status: "kadaluarsa",
};

function getVoucherStorageKey(email?: string) {
  return `marketplace-vouchers:${email || "guest"}`;
}

function normalizeVoucherCode(code: string) {
  return code.trim().toUpperCase();
}

function getTargetType(targetType?: string): Voucher["target_type"] {
  return targetType === "limited" || targetType === "loyalty"
    ? targetType
    : "all";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

function getStoredVoucherCodes(email?: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(getVoucherStorageKey(email));
    const codes: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(codes)
      ? [...new Set(
          codes
            .filter((code): code is string => typeof code === "string")
            .map((code) => normalizeVoucherCode(code)),
        )]
      : [];
  } catch {
    return [];
  }
}

function saveVoucherCodes(email: string | undefined, codes: string[]) {
  if (typeof window === "undefined") return;

  const normalizedCodes = [...new Set(codes.map((code) => normalizeVoucherCode(code)))];

  try {
    window.localStorage.setItem(
      getVoucherStorageKey(email),
      JSON.stringify(normalizedCodes),
    );
  } catch {
    // Ignore storage write failures (private mode, quota, or unavailable browser APIs).
  }
}

const STATUS_STYLE: Record<VoucherStatus, string> = {
  aktif: "bg-primary/10 text-primary",
  terpakai: "bg-background text-text-secondary",
  kadaluarsa: "bg-background text-text-secondary line-through decoration-1",
};

const ITEMS_PER_PAGE = 5;

const STATUS_LABEL: Record<VoucherStatus, string> = {
  aktif: "Aktif",
  terpakai: "Terpakai",
  kadaluarsa: "Kadaluarsa",
};

export function VoucherTab() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [claimableLoyalty, setClaimableLoyalty] = useState<
    ClaimableLoyaltyVoucher[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const { user } = useAuth();
  const { tiers } = useLoyalties();
  const email = user?.email;
  const loyaltyPoints = user?.loyalty_points ?? 0;
  const { formatPrice } = useCurrency();

  // Listen to real-time voucher updates from WebSocket
  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener("voucher-updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    const unsub = websocketService.on("voucher_updated", handleUpdate);
    return () => {
      window.removeEventListener("voucher-updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      unsub();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadVouchers() {
      setIsLoading(true);

      try {
        // Fetch user's actual wallet vouchers and claimable loyalty tier vouchers in parallel
        const [myVouchersRes, claimableRes] = await Promise.allSettled([
          api.get<ApiEnvelope<ApiWalletVoucher[]>>(
            "/ecommerce/vouchers/my-vouchers",
          ),
          api.get<ApiEnvelope<ApiClaimableVoucher[]>>(
            "/ecommerce/vouchers/claimable-loyalty",
          ),
        ]);

        if (cancelled) return;

        // Process claimable loyalty vouchers
        if (
          claimableRes.status === "fulfilled" &&
          Array.isArray(claimableRes.value.data?.data)
        ) {
          const mappedClaimable: ClaimableLoyaltyVoucher[] =
            claimableRes.value.data.data.map((item) => {
              const v = item.voucher ?? {};
              const isPercentage = v.voucher_type === "percentage";
              const discountValue = Number(v.discount_value) || 0;
              const code = v.code ?? "";
              return {
                is_claimed: Boolean(item.is_claimed),
                tier_name: item.tier_name || "",
                voucher: {
                  id: String(v.uuid ?? v.id ?? code),
                  code,
                  title: v.description || code,
                  discount_label: isPercentage
                    ? `${discountValue}% OFF`
                    : formatPrice(discountValue),
                  discount_amount: !isPercentage ? discountValue : undefined,
                  discount_percent: isPercentage ? discountValue : undefined,
                  expires_at: v.valid_to_date
                    ? new Date(v.valid_to_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Berlaku",
                  status: "aktif" as VoucherStatus,
                  target_type: "loyalty",
                },
              };
            });
          setClaimableLoyalty(mappedClaimable);
        }

        // Process user's wallet vouchers
        if (
          myVouchersRes.status === "fulfilled" &&
          Array.isArray(myVouchersRes.value.data?.data)
        ) {
          const rawWallet = myVouchersRes.value.data.data;
          const mappedWallet: Voucher[] = rawWallet.map((cv) => {
            const v = cv.voucher ?? {};
            const isPercentage = v.voucher_type === "percentage";
            const discountValue = Number(v.discount_value) || 0;
            const maxDiscount =
              v.max_discount_amount !== null &&
              v.max_discount_amount !== undefined
                ? Number(v.max_discount_amount)
                : undefined;
            const isExpired =
              v.valid_to_date &&
              new Date(v.valid_to_date).getTime() < Date.now();
            const code = v.code ?? "";

            let status: VoucherStatus = "aktif";
            if (cv.status === "used") {
              status = "terpakai";
            } else if (cv.status === "expired" || isExpired) {
              status = "kadaluarsa";
            }

            return {
              id: String(cv.uuid ?? v.uuid ?? v.id ?? code),
              code,
              title: v.description || code,
              discount_label: isPercentage
                ? `${discountValue}% OFF`
                : formatPrice(discountValue),
              discount_amount: !isPercentage ? discountValue : undefined,
              discount_percent: isPercentage ? discountValue : undefined,
              max_discount_amount: maxDiscount,
              voucher_type: v.voucher_type,
              min_purchase_amount: v.min_purchase_amount
                ? Number(v.min_purchase_amount)
                : undefined,
              min_purchase: v.min_purchase_amount
                ? `Min. belanja ${formatPrice(Number(v.min_purchase_amount))}`
                : undefined,
              expires_at: v.valid_to_date
                ? new Date(v.valid_to_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Berlaku",
              status,
              target_type: getTargetType(v.target_type),
            };
          });

          setVouchers(mappedWallet);
          setCurrentPage(1);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fallback on network error
      }

      // Guest or offline fallback
      if (!cancelled) {
        const loyaltyVoucher =
          loyaltyPoints >= LOYALTY_REWARD_THRESHOLD
            ? [LOYALTY_REWARD_VOUCHER]
            : [];
        const fallback = [
          ...loyaltyVoucher,
          ...CHECKOUT_VOUCHERS,
          EXPIRED_VOUCHER,
        ];
        setVouchers(fallback);
        setCurrentPage(1);
        setIsLoading(false);
      }
    }

    loadVouchers();
    return () => {
      cancelled = true;
    };
  }, [email, loyaltyPoints, formatPrice, refreshKey, tiers]);

  async function handleClaimLoyalty(voucherId: string) {
    try {
      setClaimingId(voucherId);
      await api.post(`/ecommerce/vouchers/${voucherId}/claim`);
      showToast("Voucher reward loyalty berhasil diklaim ke akun Anda!");
      setRefreshKey((k) => k + 1);
    } catch (error: unknown) {
      showToast(
        getErrorMessage(error, "Gagal mengklaim voucher loyalty"),
      );
    } finally {
      setClaimingId(null);
    }
  }

  async function handleAddVoucher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = normalizeVoucherCode(voucherCodeInput);
    if (!code) {
      setVoucherError("Masukkan kode voucher.");
      return;
    }

    if (
      vouchers.some(
        (v) => normalizeVoucherCode(v.code) === code && v.status === "aktif",
      )
    ) {
      setVoucherError("Voucher ini sudah ada di dompet akun Anda.");
      return;
    }

    try {
      const res = await api.post<ApiEnvelope<ApiVoucherValidation>>(
        "/ecommerce/vouchers/validate",
        {
          code,
          order_total: 1000000,
        },
      );

      const resData = res.data?.data;
      const v = resData?.voucher;
      if (!resData?.valid || !v) {
        setVoucherError(resData?.message || "Kode voucher tidak valid.");
        return;
      }

      const isPercentage = v.voucher_type === "percentage";
      const discountValue = Number(v.discount_value) || 0;
      const voucherCode = v.code ?? code;
      const newVoucher: Voucher = {
        id: String(v.uuid ?? v.id ?? voucherCode),
        code: voucherCode,
        title: v.description || voucherCode,
        discount_label: isPercentage
          ? `${discountValue}% OFF`
          : formatPrice(discountValue),
        discount_amount: !isPercentage ? discountValue : undefined,
        discount_percent: isPercentage ? discountValue : undefined,
        expires_at: v.valid_to_date
          ? new Date(v.valid_to_date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Berlaku",
        status: "aktif",
        target_type: getTargetType(v.target_type),
      };

      const storedCodes = getStoredVoucherCodes(email);
      saveVoucherCodes(email, [...storedCodes, code]);

      setVouchers((prev) => [newVoucher, ...prev]);
      setCurrentPage(1);
      setVoucherCodeInput("");
      setVoucherError("");
      showToast("Voucher berhasil ditambahkan ke akun Anda.");
    } catch (error: unknown) {
      setVoucherError(
        getErrorMessage(
          error,
          "Kode voucher tidak valid atau sudah kedaluwarsa.",
        ),
      );
    }
  }

  const totalPages = Math.max(1, Math.ceil(vouchers.length / ITEMS_PER_PAGE));
  const paginatedVouchers = vouchers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Loyalty Reward Vouchers Section */}
      {claimableLoyalty.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Trophy className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200 sm:text-base">
              Voucher Reward Tier Loyalty Kamu
            </h2>
            <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
          </div>
          <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80 sm:text-sm">
            Klaim voucher diskon eksklusif yang berhak kamu dapatkan sesuai
            tingkat loyalty akunmu.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {claimableLoyalty.map((cl) => {
              const v = cl.voucher;
              const isClaiming = claimingId === v.id;
              return (
                <div
                  key={v.id}
                  className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4 shadow-xs dark:border-amber-900/60 dark:bg-background min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all font-mono text-xs font-bold tracking-wider text-amber-700 dark:text-amber-400">
                        {v.code}
                      </span>
                      <span className="whitespace-nowrap rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                        Tier {cl.tier_name}
                      </span>
                    </div>
                    <p className="mt-1 wrap-break-word text-sm font-semibold text-text">
                      {v.title}
                    </p>
                    <p className="text-xs font-bold text-accent">
                      {v.discount_label}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {cl.is_claimed ? (
                      <span className="inline-block whitespace-nowrap rounded-md bg-secondary/15 px-3 py-1.5 text-xs font-semibold text-secondary">
                        Sudah Diklaim
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isClaiming}
                        onClick={() => handleClaimLoyalty(v.id)}
                        className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-600 disabled:opacity-50 min-[420px]:w-auto">
                        {isClaiming ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Klaim Voucher
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Wallet Vouchers */}
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-text">
              Dompet Voucher Saya
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Voucher yang otomatis masuk dan aktif di akun Anda.
            </p>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-bold text-primary">
            {vouchers.length} Voucher
          </span>
        </div>

        <form
          onSubmit={handleAddVoucher}
          className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={voucherCodeInput}
            onChange={(event) => {
              setVoucherCodeInput(event.target.value);
              if (voucherError) {
                setVoucherError("");
              }
            }}
            placeholder="Punya kode promo lain? Masukkan di sini..."
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase text-text outline-none placeholder:normal-case focus:border-primary"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            Tambah Voucher
          </button>
        </form>

        {voucherError ? (
          <p className="mt-2 text-xs text-red-500">{voucherError}</p>
        ) : null}

        {isLoading ? (
          <div className="mt-4 flex flex-col gap-3">
            {[1, 2, 3].map((skeleton) => (
              <div
                key={skeleton}
                className="h-20 animate-pulse rounded-xl border border-border bg-background"
              />
            ))}
          </div>
        ) : vouchers.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-10 text-center sm:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Ticket className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-text">
              Belum ada voucher
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Voucher diskon otomatis dan kupon yang kamu klaim akan muncul di
              sini.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {paginatedVouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:p-4">
                <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="break-all font-mono text-xs font-bold tracking-wider text-primary">
                        {voucher.code}
                      </span>
                      <span
                        className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          STATUS_STYLE[voucher.status]
                        }`}>
                        {STATUS_LABEL[voucher.status]}
                      </span>
                      {voucher.target_type === "all" && (
                        <span className="whitespace-nowrap rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          Semua Akun
                        </span>
                      )}
                      {voucher.target_type === "limited" && (
                        <span className="whitespace-nowrap rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                          Khusus Anda
                        </span>
                      )}
                      {voucher.target_type === "loyalty" && (
                        <span className="whitespace-nowrap rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Reward Loyalty
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 wrap-break-word text-sm font-semibold text-text">
                      {voucher.title}
                    </p>
                    {voucher.min_purchase ? (
                      <p className="text-xs text-text-secondary">
                        {voucher.min_purchase}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-3 border-t border-border pt-2 text-right sm:w-auto sm:shrink-0 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                  <span className="text-xs font-bold text-accent sm:text-sm">
                    {voucher.discount_label}
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Berlaku s/d {voucher.expires_at}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && !isLoading && (
          <div className="mt-6 flex justify-center overflow-x-auto">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
