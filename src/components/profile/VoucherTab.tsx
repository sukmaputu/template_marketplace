import { useEffect, useState, type FormEvent } from "react";
import { Plus, Ticket } from "lucide-react";
import type { Voucher, VoucherStatus } from "@/components/profile/types";
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

function getStoredVoucherCodes(email?: string): string[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(getVoucherStorageKey(email));
    const codes: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(codes)
      ? codes.filter((code): code is string => typeof code === "string")
      : [];
  } catch {
    return [];
  }
}

function saveVoucherCodes(email: string | undefined, codes: string[]) {
  window.localStorage.setItem(
    getVoucherStorageKey(email),
    JSON.stringify(codes),
  );
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
  const [availablePool, setAvailablePool] = useState<Voucher[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
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
      const loyaltyVoucher =
        loyaltyPoints >= LOYALTY_REWARD_THRESHOLD
          ? [LOYALTY_REWARD_VOUCHER]
          : [];

      const tierVouchers: Voucher[] = (tiers || [])
        .filter((t) => t.voucher && loyaltyPoints >= t.min_point)
        .map((t) => ({
          id: t.voucher!.uuid,
          code: t.voucher!.code,
          title: `Reward ${t.name}`,
          discount_label:
            t.voucher!.discount_type === "PERCENTAGE"
              ? `${t.voucher!.discount_value}% OFF`
              : formatPrice(t.voucher!.discount_value),
          discount_amount:
            t.voucher!.discount_type === "FIXED"
              ? t.voucher!.discount_value
              : undefined,
          min_purchase: `Min. poin: ${t.min_point}`,
          expires_at: "Berlaku",
          status: "aktif",
        }));

      try {
        const res = await api.get("/ecommerce/vouchers/active");
        const list = res.data?.data;
        if (Array.isArray(list) && !cancelled) {
          const mapped: Voucher[] = list.map((v: any) => {
            const isPercentage = v.voucher_type === "percentage";
            const discountValue = Number(v.discount_value) || 0;
            const maxDiscount =
              v.max_discount_amount !== null && v.max_discount_amount !== undefined
                ? Number(v.max_discount_amount)
                : undefined;
            return {
              id: v.uuid || v.id || v.code,
              code: v.code,
              title: v.description || v.code,
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
              status: "aktif",
            };
          });

          setAvailablePool([
            ...CHECKOUT_VOUCHERS,
            ...mapped,
            ...loyaltyVoucher,
            ...tierVouchers,
          ]);

          // Also check stored custom voucher codes
          const storedCodes = getStoredVoucherCodes(email);
          const allAvailable = [
            ...CHECKOUT_VOUCHERS,
            ...mapped,
            ...loyaltyVoucher,
            ...tierVouchers,
          ];
          const storedVouchers = storedCodes
            .map((code) =>
              allAvailable.find(
                (v) => v.code.toUpperCase() === code.toUpperCase(),
              ),
            )
            .filter((v): v is Voucher => v !== undefined);

          const combined = [
            ...loyaltyVoucher,
            ...tierVouchers,
            ...mapped,
            ...storedVouchers.filter(
              (s) =>
                !mapped.some((m) => m.code === s.code) &&
                !loyaltyVoucher.some((l) => l.code === s.code) &&
                !tierVouchers.some((t) => t.code === s.code),
            ),
            EXPIRED_VOUCHER,
          ];

          setVouchers(combined);
          setCurrentPage(1);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fallback on network error
      }

      if (!cancelled) {
        const fallback = [
          ...loyaltyVoucher,
          ...tierVouchers,
          ...CHECKOUT_VOUCHERS,
          EXPIRED_VOUCHER,
        ];
        setAvailablePool(fallback);
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

  function handleAddVoucher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) {
      setVoucherError("Masukkan kode voucher.");
      return;
    }

    const tierVouchers: Voucher[] = (tiers || [])
      .filter((t) => t.voucher && loyaltyPoints >= t.min_point)
      .map((t) => ({
        id: t.voucher!.uuid,
        code: t.voucher!.code,
        title: `Reward ${t.name}`,
        discount_label:
          t.voucher!.discount_type === "PERCENTAGE"
            ? `${t.voucher!.discount_value}% OFF`
            : formatPrice(t.voucher!.discount_value),
        discount_amount:
          t.voucher!.discount_type === "FIXED"
            ? t.voucher!.discount_value
            : undefined,
        min_purchase: `Min. poin: ${t.min_point}`,
        expires_at: "Berlaku",
        status: "aktif",
      }));

    const allCandidatePool = [
      ...availablePool,
      ...CHECKOUT_VOUCHERS,
      ...(loyaltyPoints >= LOYALTY_REWARD_THRESHOLD
        ? [LOYALTY_REWARD_VOUCHER]
        : []),
      ...tierVouchers,
    ];
    const found = allCandidatePool.find(
      (voucher) =>
        voucher.code.toUpperCase() === code && voucher.status === "aktif",
    );

    if (!found) {
      setVoucherError("Kode voucher tidak valid atau sudah kedaluwarsa.");
      return;
    }
    if (vouchers.some((voucher) => voucher.code === found.code)) {
      setVoucherError("Voucher ini sudah ada di daftar Voucher Saya.");
      return;
    }

    const storedCodes = getStoredVoucherCodes(email);
    try {
      saveVoucherCodes(
        email,
        storedCodes.includes(found.code)
          ? storedCodes
          : [...storedCodes, found.code],
      );
    } catch {
      setVoucherError("Voucher gagal disimpan. Silakan coba lagi.");
      return;
    }

    setVouchers((previous) => [found, ...previous]);
    setCurrentPage(1);
    setVoucherCodeInput("");
    setVoucherError("");
    showToast("Voucher berhasil ditambahkan.");
  }

  const totalPages = Math.max(1, Math.ceil(vouchers.length / ITEMS_PER_PAGE));
  const paginatedVouchers = vouchers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-text">Voucher Saya</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Voucher yang kamu punya, termasuk yang sudah tidak berlaku.
      </p>

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
          placeholder="Masukkan kode voucher"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase text-text outline-none placeholder:normal-case focus:border-primary"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
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
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Ticket className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium text-text">
            Belum ada voucher
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Voucher diskon atau gratis ongkir yang kamu klaim akan muncul di
            sini.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {paginatedVouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider text-primary">
                      {voucher.code}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        STATUS_STYLE[voucher.status]
                      }`}>
                      {STATUS_LABEL[voucher.status]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-text">
                    {voucher.title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {voucher.min_purchase}
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center justify-between border-t border-border pt-2 text-right sm:w-auto sm:flex-col sm:items-end sm:border-0 sm:pt-0">
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
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
