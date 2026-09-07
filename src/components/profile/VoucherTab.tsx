import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import type { Voucher, VoucherStatus } from "@/components/profile/types";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";
import { useAuth } from "@/components/auth/UseAuth";
import {
  LOYALTY_REWARD_THRESHOLD,
  LOYALTY_REWARD_VOUCHER,
} from "@/lib/vouchers";

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
  {
    id: "3",
    code: "FLASH10",
    title: "Flash Sale Agustus",
    discount_label: "10% OFF",
    expires_at: "31 Agu 2026",
    status: "kadaluarsa",
  },
];

const STATUS_STYLE: Record<VoucherStatus, string> = {
  aktif: "bg-primary/10 text-primary",
  terpakai: "bg-background text-text-secondary",
  kadaluarsa: "bg-background text-text-secondary line-through decoration-1",
};

const STATUS_LABEL: Record<VoucherStatus, string> = {
  aktif: "Aktif",
  terpakai: "Terpakai",
  kadaluarsa: "Kadaluarsa",
};

export function VoucherTab() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      const loyaltyVoucher =
        (user?.loyalty_points ?? 0) >= LOYALTY_REWARD_THRESHOLD
          ? [LOYALTY_REWARD_VOUCHER]
          : [];
      setVouchers([...DUMMY_VOUCHERS, ...loyaltyVoucher]);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [user?.loyalty_points]);

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-text">Voucher Saya</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Voucher yang kamu punya, termasuk yang sudah tidak berlaku.
      </p>

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
          vouchers.map((v) => (
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
    </div>
  );
}
