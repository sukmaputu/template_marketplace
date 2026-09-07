import { Link } from "react-router-dom";
import { MapPin, Package, RotateCcw, Truck } from "lucide-react";
import type { Order } from "./types";
import { ORDER_STATUS_CONFIG } from "./types";
import { isRefundEligible } from "./utils";
import { CountdownTimer } from "./CountdownTimer";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";

export function OrderCard({
  order,
  onTrackClick,
  onMarkReceived,
  onCancelClick,
  onRefundClick,
  onReviewClick,
}: {
  order: Order;
  onTrackClick: (order: Order) => void;
  onMarkReceived: (orderId: string) => void;
  onCancelClick: (order: Order) => void;
  onRefundClick: (order: Order) => void;
  onReviewClick?: (order: Order) => void;
}) {
  const { formatPrice } = useCurrency();
  const statusInfo = ORDER_STATUS_CONFIG[order.status];
  const isInProgress =
    order.status === "processing" ||
    order.status === "shipping" ||
    order.status === "pending_payment" ||
    order.status === "paid";

  const showShippingSummary =
    (order.status === "processing" || order.status === "shipping") &&
    (order.shippingAddress || order.courierName);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background/50 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs font-medium text-text-secondary">
            Pesanan #{order.id}
          </span>
          <span className="hidden text-xs text-text-secondary sm:inline">
            •
          </span>
          <span className="text-xs text-text-secondary">{order.date}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {order.cancelDeadline && isInProgress && (
            <CountdownTimer deadlineIso={order.cancelDeadline} />
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.badgeClassName}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
            <div className="flex min-w-0 items-center gap-3 sm:contents">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-background border border-border sm:h-16 sm:w-16">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.product_name_snapshot}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-text-secondary sm:h-6 sm:w-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-text">
                  {item.product_name_snapshot}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  Variasi: {item.variant_name_snapshot}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 sm:contents">
              <span className="text-xs text-text-secondary sm:hidden">
                Subtotal
              </span>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-text">
                  {formatPrice(item.unit_price)}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  x{item.quantity}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showShippingSummary && (
        <button
          onClick={() => onTrackClick(order)}
          className="flex w-full items-center gap-2 border-t border-border bg-background/40 px-3 py-2.5 text-left hover:bg-background sm:px-4">
          <Truck className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
          <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
            {order.courierName ? (
              <span className="font-medium text-text">{order.courierName}</span>
            ) : null}
            {order.trackingNumber ? (
              <span> • No. Resi {order.trackingNumber}</span>
            ) : null}
            {order.shippingAddress ? (
              <span className="inline-flex items-center gap-1">
                {" "}
                <MapPin className="hidden h-3 w-3 sm:inline" />
                Tujuan {order.shippingAddress.city}
              </span>
            ) : null}
            {order.estimatedDelivery ? (
              <span> • Estimasi tiba {order.estimatedDelivery}</span>
            ) : null}
          </span>
        </button>
      )}

      <div className="flex flex-col gap-3 border-t border-border bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="text-sm text-text-secondary">
          Total Pesanan:{" "}
          <span className="text-base font-bold text-text">
            {formatPrice(order.grand_total)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:self-auto">
          {order.status === "pending_payment" && (
            <>
              <button
                onClick={() => onCancelClick(order)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-background">
                Batalkan
              </button>
              <button className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:opacity-90">
                Bayar Sekarang
              </button>
            </>
          )}

          {order.status === "processing" && (
            <button
              onClick={() => onTrackClick(order)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-text hover:bg-background">
              <Truck className="h-3.5 w-3.5 text-text-secondary" />
              Rincian Pengiriman
            </button>
          )}

          {order.status === "shipping" && (
            <>
              <button
                onClick={() => onTrackClick(order)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-text hover:bg-background">
                <Truck className="h-3.5 w-3.5 text-primary" />
                Lacak Pengiriman
              </button>
              <button
                onClick={() => onMarkReceived(order.id)}
                className="rounded-lg bg-secondary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90">
                Pesanan Diterima
              </button>
            </>
          )}

          {order.status === "completed" && (
            <>
              {onReviewClick && (
                <button
                  type="button"
                  onClick={() => onReviewClick(order)}
                  className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-text hover:bg-background">
                  Beri Ulasan
                </button>
              )}
              <Link
                to="/"
                className="inline-block rounded-lg bg-primary px-4 py-1.5 text-center text-xs font-medium text-white hover:opacity-90">
                Beli Lagi
              </Link>
            </>
          )}

          {isRefundEligible(order) && (
            <div className="flex items-center gap-2">
              {order.refundDeadline && (
                <CountdownTimer deadlineIso={order.refundDeadline} />
              )}
              <button
                onClick={() => onRefundClick(order)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-text hover:bg-background">
                <RotateCcw className="h-3.5 w-3.5 text-text-secondary" />
                Ajukan Refund
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
