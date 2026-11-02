import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, CheckCircle2, Clock, Copy } from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { useAuth } from "@/components/auth/UseAuth";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";
import {
  loadCheckoutOrderState,
  saveCheckoutOrderState,
  type CheckoutOrderState,
} from "@/lib/checkoutFlow";
import { showToast } from "@/lib/toast";
import { formatCheckoutPrice } from "@/lib/checkoutFlow";
import { motion } from "motion/react";

export default function WaitingConfirmationPage() {
  const location = useLocation();
  const { user, addLoyaltyPoints } = useAuth();
  const routeState = location.state as CheckoutOrderState | undefined;
  const [orderState] = useState<CheckoutOrderState | null>(
    () => routeState ?? loadCheckoutOrderState(),
  );
  const [proofSubmitted] = useState(
    () => routeState?.proofSubmitted ?? loadCheckoutOrderState()?.proofSubmitted ?? false,
  );
  const [isProcessing, setIsProcessing] = useState(
    () => routeState?.showProcessingAnimation === true,
  );

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!routeState) return;
    saveCheckoutOrderState(routeState);
  }, [routeState]);

  useEffect(() => {
    if (!isProcessing) return;
    const timer = window.setTimeout(() => setIsProcessing(false), 5000);
    return () => window.clearTimeout(timer);
  }, [isProcessing]);

  useEffect(() => {
    if (!orderState?.loyaltyPointsEarned || !user) return;
    const rewardKey = `marketplace-reward-applied:${orderState.orderUuid || orderState.orderId}`;
    if (localStorage.getItem(rewardKey)) return;
    addLoyaltyPoints(orderState.loyaltyPointsEarned);
    localStorage.setItem(rewardKey, "true");
  }, [addLoyaltyPoints, orderState, user]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplaceHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {isProcessing ? (
          <section className="rounded-xl border border-border bg-surface px-6 py-16 text-center sm:px-10">
            <div
              role="status"
              aria-live="polite"
              className="mx-auto flex max-w-md flex-col items-center">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 animate-spin rounded-full border-4 border-border border-t-primary" />
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <h1 className="mt-6 text-xl font-bold text-text">
                Menyiapkan Pesanan
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Mohon tunggu sebentar
              </p>
            </div>
          </section>
        ) : !orderState ? (
          <section className="rounded-xl border border-border bg-surface p-8 text-center">
            <h1 className="text-xl font-bold text-text">
              Detail pesanan tidak tersedia
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Buka riwayat pembelian untuk melihat status pesanan terbaru.
            </p>
            <Link
              to="/profile?tab=riwayat-pembelian"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
              Lihat Pesanan
            </Link>
          </section>
        ) : (
          <section className="rounded-xl border border-border bg-surface p-6 sm:p-10">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                proofSubmitted ? "bg-emerald-500" : "bg-amber-500"
              }`}>
              {proofSubmitted ? (
                <motion.svg
                  viewBox="0 0 24 24"
                  className="h-9 w-9"
                  initial="hidden"
                  animate="visible">
                  <motion.path
                    d="M5 13l4 4L19 7"
                    fill="none"
                    stroke="white"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={{
                      hidden: { pathLength: 0, opacity: 0 },
                      visible: {
                        pathLength: 1,
                        opacity: 1,
                        transition: {
                          delay: 0.3,
                          duration: 0.5,
                          ease: "easeOut",
                        },
                      },
                    }}
                  />
                </motion.svg>
              ) : (
                <Clock className="h-9 w-9 text-white" />
              )}
              <motion.span
                className={`absolute inset-0 rounded-full border-2 ${
                  proofSubmitted ? "border-emerald-500" : "border-amber-500"
                }`}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              />
            </motion.div>
            <div className="mt-5 text-center">
              <h1 className="text-2xl font-bold text-text">
                {proofSubmitted
                  ? "Menunggu Konfirmasi Pembayaran"
                  : "Menunggu Bukti Pembayaran"}
              </h1>
              <p className="mx-auto mt-2 max-w-lg text-sm text-text-secondary">
                {proofSubmitted
                  ? "Bukti pembayaran sudah diterima. Pesanan ini menunggu pemeriksaan admin; kamu bisa melihat statusnya dari riwayat pembelian."
                  : "Pesanan sudah berhasil dibuat. Halaman status ini bisa kamu gunakan untuk mengecek alur demo; unggah bukti transfer agar admin dapat memulai verifikasi."}
              </p>
            </div>

            <div className="mx-auto mt-6 max-w-lg rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Status Pesanan
              </p>
              <div className="mt-3 flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-text">
                    Pesanan berhasil dibuat
                  </p>
                  <p className="text-xs text-text-secondary">
                    Nomor pesanan sudah tercatat.
                  </p>
                </div>
              </div>
              <div className="ml-2.5 mt-1 h-5 border-l border-border" />
              <div className="flex items-start gap-3">
                {proofSubmitted ? (
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                ) : (
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-500 text-xs font-semibold text-amber-700">
                    2
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-text">
                    {proofSubmitted
                      ? "Menunggu verifikasi admin"
                      : "Menunggu bukti pembayaran"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {proofSubmitted
                      ? "Admin akan memeriksa bukti transfer yang dikirim."
                      : "Unggah bukti transfer untuk melanjutkan verifikasi pembayaran."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-lg rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-text-secondary">No. Pesanan</span>
                <span className="font-semibold text-text">
                  {orderState.orderId}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-text-secondary">Total Tagihan</span>
                <span className="font-bold text-primary">
                  {formatCheckoutPrice(
                    orderState.totalPaid,
                    orderState.currency,
                    orderState.exchangeRate,
                  )}
                </span>
              </div>
            </div>

            {orderState.paymentMethod && (
              <div className="mx-auto mt-5 max-w-lg rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Metode Pembayaran
                    </p>
                    <p className="text-sm font-bold text-text">
                      {orderState.paymentMethod.bank_name ||
                        orderState.paymentMethod.name}
                    </p>
                  </div>
                </div>

                {orderState.paymentMethod.account_number && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-surface p-3">
                    <div>
                      <p className="text-xs text-text-secondary">
                        Nomor Rekening
                      </p>
                      <p className="font-mono font-bold text-text">
                        {orderState.paymentMethod.account_number}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard
                          .writeText(
                            orderState.paymentMethod?.account_number || "",
                          )
                          .then(() => showToast("Nomor rekening disalin!"));
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary">
                      <Copy className="h-3.5 w-3.5" />
                      Salin
                    </button>
                  </div>
                )}

                <p className="mt-3 text-xs text-text-secondary">
                  Atas Nama:{" "}
                  <span className="font-semibold text-text">
                    {orderState.paymentMethod.account_holder ||
                      orderState.paymentMethod.account_holder_name ||
                      "-"}
                  </span>
                </p>
                {orderState.paymentMethod.instructions && (
                  <p className="mt-2 text-xs text-text-secondary">
                    {orderState.paymentMethod.instructions}
                  </p>
                )}
              </div>
            )}

            {orderState.items.length > 0 && (
              <ul className="mx-auto mt-5 max-w-lg divide-y divide-border rounded-lg border border-border">
                {orderState.items.map((item, index) => (
                  <li
                    key={`${item.productId}-${index}`}
                    className="flex justify-between gap-3 p-3 text-xs">
                    <span className="text-text">
                      {item.name} ({item.variant}) × {item.quantity}
                    </span>
                    <span className="shrink-0 text-text-secondary">
                      {formatCheckoutPrice(
                        item.price * item.quantity,
                        orderState.currency,
                        orderState.exchangeRate,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div
              className={`mx-auto mt-6 grid w-full max-w-lg gap-2 sm:gap-3 ${
                proofSubmitted ? "grid-cols-2" : "grid-cols-3"
              }`}>
              <InvoiceDownloadButton
                orderState={orderState}
                className="inline-flex min-w-0 w-full items-center justify-center gap-1 rounded-md border border-border px-2 py-2.5 text-center text-xs font-semibold text-text hover:border-primary sm:gap-2 sm:px-3 sm:text-sm"
              />
              {!proofSubmitted && (
                <Link
                  to="/upload-payment-proof"
                  state={orderState}
                  className="inline-flex min-w-0 w-full items-center justify-center rounded-md bg-primary px-2 py-2.5 text-center text-xs font-semibold text-white hover:opacity-90 sm:px-3 sm:text-sm">
                  Unggah Bukti Transfer
                </Link>
              )}
              <Link
                to="/profile?tab=riwayat-pembelian"
                className="inline-flex min-w-0 w-full items-center justify-center rounded-md border border-border px-2 py-2.5 text-center text-xs font-semibold text-text hover:border-primary sm:px-3 sm:text-sm">
                Lihat Riwayat Pesanan
              </Link>
            </div>
          </section>
        )}
      </main>
      <MarketplaceFooter />

    </div>
  );
}
