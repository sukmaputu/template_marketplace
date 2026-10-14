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

function getStoredVoucherCodes(email?: string) {
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

function getInitialVouchers(email: string | undefined, loyaltyPoints: number) {
  const loyaltyVouchers =
    loyaltyPoints >= LOYALTY_REWARD_THRESHOLD ? [LOYALTY_REWARD_VOUCHER] : [];
  const availableVouchers = [...CHECKOUT_VOUCHERS, ...loyaltyVouchers];
  const existingVouchers = [...loyaltyVouchers, EXPIRED_VOUCHER];
  const storedVouchers = getStoredVoucherCodes(email)
    .map((code) =>
      availableVouchers.find(
        (voucher) => voucher.code.toUpperCase() === code.toUpperCase(),
      ),
    )
    .filter((voucher): voucher is Voucher => voucher !== undefined);

  return [
    ...existingVouchers,
    ...storedVouchers.filter(
      (stored) =>
        !existingVouchers.some((voucher) => voucher.code === stored.code),
    ),
  ];
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const { user } = useAuth();
  const email = user?.email;
  const loyaltyPoints = user?.loyalty_points ?? 0;
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVouchers(getInitialVouchers(email, loyaltyPoints));
      setCurrentPage(1);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [email, loyaltyPoints]);

  function handleAddVoucher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) {
      setVoucherError("Masukkan kode voucher.");
      return;
    }

    const availableVouchers =
      loyaltyPoints >= LOYALTY_REWARD_THRESHOLD
        ? [...CHECKOUT_VOUCHERS, LOYALTY_REWARD_VOUCHER]
        : CHECKOUT_VOUCHERS;
    const found = availableVouchers.find(
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
            if (voucherError) setVoucherError("");
          }}
          placeholder="Masukkan kode voucher"
          aria-label="Kode voucher"
          aria-invalid={Boolean(voucherError)}
          className={`min-w-0 flex-1 rounded-lg border bg-background px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary ${
            voucherError ? "border-red-500" : "border-border"
          }`}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus className="h-4 w-4" />
          Tambah Voucher
        </button>
      </form>
      {voucherError && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {voucherError}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {isLoading &&
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-background"
            />
          ))}

        {!isLoading && vouchers.length === 0 && (
          <p className="py-8 text-center text-sm text-text-secondary">
            Belum ada voucher yang tersedia.
          </p>
        )}

        {!isLoading &&
          paginatedVouchers.map((v) => (
            <div
              key={v.id}
              className={`flex items-start gap-3 rounded-lg border border-border p-4 ${
                v.status === "kadaluarsa" ? "opacity-60" : ""
              }`}>
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background border border-border">
                <Ticket className="h-4 w-4 text-text-secondary" />
              </span>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text">{v.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[v.status]}`}>
                    {STATUS_LABEL[v.status]}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-primary font-semibold">
                  {v.discount_amount !== undefined
                    ? formatPrice(v.discount_amount)
                    : v.discount_label}
                </p>
                {v.min_purchase && (
                  <p className="text-xs text-text-secondary">
                    {v.min_purchase_amount !== undefined
                      ? `Min. belanja ${formatPrice(v.min_purchase_amount)}`
                      : v.min_purchase}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <code className="rounded bg-background px-2 py-1 text-xs font-medium text-text">
                    {v.code}
                  </code>
                  <p className="text-xs text-text-secondary">
                    Berlaku s/d {v.expires_at}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>

      {!isLoading && vouchers.length > 0 && (
        <div className="mt-6 border-t border-border">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </div>
  );
}
