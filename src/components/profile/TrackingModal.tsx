import { Truck, X } from "lucide-react";
import type { Order } from "./types";

export function TrackingModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-text">
              Informasi Pengiriman
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-background hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-background p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Kurir:</span>
            <span className="font-semibold text-text">
              {order.courierName || "Standar Kurir"}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-text-secondary">No. Resi:</span>
            <span className="font-mono font-medium text-primary">
              {order.trackingNumber || "-"}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Riwayat Status Paket
          </p>

          <div className="space-y-4">
            {order.trackingTimeline && order.trackingTimeline.length > 0 ? (
              order.trackingTimeline.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  {idx !== order.trackingTimeline!.length - 1 && (
                    <span className="absolute left-2.5 top-5 h-full w-[2px] bg-border" />
                  )}
                  <span
                    className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      step.completed
                        ? "bg-secondary text-white"
                        : "bg-border text-text-secondary"
                    }`}>
                    {step.completed ? "✓" : "•"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-semibold ${step.completed ? "text-text" : "text-text-secondary"}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {step.description}
                    </p>
                    <span className="text-[10px] text-text-secondary/70 mt-1 block">
                      {step.time}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-secondary text-center py-4">
                Belum ada update pelacakan.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-surface border border-border px-4 py-2 text-xs font-medium text-text hover:bg-background">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
