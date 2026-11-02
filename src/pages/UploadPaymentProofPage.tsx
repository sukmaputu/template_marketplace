import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, Clock, Upload } from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { PaymentProofModal } from "@/components/profile/PaymentProofModal";
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton";
import type { Order } from "@/components/profile/types";
import {
  loadCheckoutOrderState,
  formatCheckoutPrice,
  saveCheckoutOrderState,
  type CheckoutOrderState,
} from "@/lib/checkoutFlow";
import { showToast } from "@/lib/toast";

export default function UploadPaymentProofPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as CheckoutOrderState | undefined;
  const [orderState] = useState<CheckoutOrderState | null>(
    () => routeState ?? loadCheckoutOrderState(),
  );
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (routeState) saveCheckoutOrderState(routeState);
  }, [routeState]);

  const order: Order | null =
    orderState?.orderUuid
      ? {
          id: orderState.orderId,
          uuid: orderState.orderUuid,
          status: "pending_payment",
          date: new Date().toISOString(),
          grand_total: orderState.totalPaid,
          payment: orderState.paymentMethod
            ? {
                payment_method: orderState.paymentMethod.name,
                payment_status: "pending",
                sender_bank:
                  orderState.paymentMethod.bank_name ||
                  orderState.paymentMethod.name,
                amount_paid: orderState.totalPaid,
              }
            : undefined,
          items: orderState.items.map((item, index) => ({
            id: `item-${index}`,
            productId: item.productId,
            product_name_snapshot: item.name,
            variant_name_snapshot: item.variant,
            unit_price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        }
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplaceHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {!orderState ? (
          <section className="rounded-xl border border-border bg-surface p-8 text-center">
            <h1 className="text-xl font-bold text-text">
              Detail pesanan tidak tersedia
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Silakan buka riwayat pembelian untuk melihat detail pesanan.
            </p>
            <Link
              to="/profile?tab=riwayat-pembelian"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
              Lihat Pesanan
            </Link>
          </section>
        ) : (
          <section className="rounded-xl border border-border bg-surface p-6 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="mt-5 text-center">
              <h1 className="text-2xl font-bold text-text">
                Unggah Bukti Transfer
              </h1>
              <p className="mx-auto mt-2 max-w-lg text-sm text-text-secondary">
                Pesanan sudah dibuat. Setelah melakukan transfer, unggah bukti
                pembayaran untuk dikonfirmasi admin.
              </p>
            </div>

            <div className="mx-auto mt-6 max-w-lg rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-text-secondary">No. Pesanan</span>
                <span className="font-semibold text-text">
                  {orderState.orderId}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-text-secondary">Total Transfer</span>
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
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Rekening Tujuan
                </p>
                <p className="mt-1 text-sm font-bold text-text">
                  {orderState.paymentMethod.bank_name ||
                    orderState.paymentMethod.name}
                </p>
                {orderState.paymentMethod.account_number && (
                  <p className="mt-1 font-mono text-lg font-bold text-text">
                    {orderState.paymentMethod.account_number}
                  </p>
                )}
                <p className="mt-1 text-xs text-text-secondary">
                  Atas Nama{" "}
                  {orderState.paymentMethod.account_holder ||
                    orderState.paymentMethod.account_holder_name ||
                    "-"}
                </p>
                {orderState.paymentMethod.instructions && (
                  <p className="mt-3 rounded-md bg-amber-500/10 p-2 text-xs text-amber-800">
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

            {!orderState.orderUuid && (
              <p className="mx-auto mt-5 max-w-lg rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800">
                ID order dari server belum tersedia, jadi unggah bukti belum
                dapat dikirim. Pesanan demo tetap bisa dilihat pada riwayat.
              </p>
            )}

            <div className="mx-auto mt-6 grid w-full max-w-lg grid-cols-3 gap-2 sm:gap-3">
              <InvoiceDownloadButton
                orderState={orderState}
                className="inline-flex min-w-0 w-full items-center justify-center gap-1 rounded-md border border-border px-2 py-2.5 text-center text-xs font-semibold text-text hover:border-primary sm:gap-2 sm:px-3 sm:text-sm"
              />
              <button
                type="button"
                disabled={!order || !orderState.isManual}
                onClick={() => setIsProofModalOpen(true)}
                className="inline-flex min-w-0 w-full items-center justify-center gap-1 rounded-md bg-primary px-2 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-3 sm:text-sm">
                <Upload className="h-4 w-4 shrink-0" />
                <span>Pilih Bukti Transfer</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate("/waiting-confirmation", {
                    state: { ...orderState, proofSubmitted: false },
                  })
                }
                className="inline-flex min-w-0 w-full items-center justify-center gap-1 rounded-md border border-border px-2 py-2.5 text-xs font-semibold text-text hover:border-primary sm:gap-2 sm:px-3 sm:text-sm">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Lihat Konfirmasi</span>
              </button>
            </div>
          </section>
        )}
      </main>
      <MarketplaceFooter />

      {isProofModalOpen && order && orderState && (
        <PaymentProofModal
          order={order}
          currency={orderState.currency}
          exchangeRate={orderState.exchangeRate}
          onClose={() => setIsProofModalOpen(false)}
          onSubmitted={() => {
            setIsProofModalOpen(false);
            showToast("Bukti transfer berhasil dikirim.");
            navigate("/waiting-confirmation", {
              state: {
                ...orderState,
                proofSubmitted: true,
                showProcessingAnimation: true,
              },
            });
          }}
        />
      )}
    </div>
  );
}
