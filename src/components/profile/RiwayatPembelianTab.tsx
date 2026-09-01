import { useState } from "react";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import type { Order } from "./types";
import { MOCK_ORDERS } from "./MockData";
import { OrderCard } from "./OrderCard";
import { TrackingModal } from "./TrackingModal";
import { RefundModal } from "./RefundModal";
import { ConfirmModal } from "./ConfirmModal";

export function RiwayatPembelianTab() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedOrderForTracking, setSelectedOrderForTracking] =
    useState<Order | null>(null);
  const [selectedOrderForRefund, setSelectedOrderForRefund] =
    useState<Order | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] =
    useState<Order | null>(null);

  const ITEMS_PER_PAGE = 10;

  const filterTabs = [
    { key: "ALL", label: "Semua" },
    { key: "pending_payment", label: "Belum Bayar" },
    { key: "processing", label: "Diproses" },
    { key: "shipped", label: "Dikirim" },
    { key: "completed", label: "Selesai" },
    { key: "cancelled", label: "Dibatalkan" },
    { key: "refunded", label: "Refund" },
  ];

  const filteredOrders = orders.filter((order) => {
    if (selectedStatus === "ALL") return true;
    return order.status === selectedStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleFilterChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleMarkReceived = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o)),
    );
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)),
    );
    setSelectedOrderForCancel(null);
  };

  const handleRefundSubmit = (
    orderId: string,
    reason: string,
    note: string,
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: "refunded", refundReason: reason, refundNote: note }
          : o,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-surface p-1.5">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-4 sm:py-2 sm:text-xs ${
              selectedStatus === tab.key
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-background hover:text-text"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {paginatedOrders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-text-secondary/60 mb-2" />
          <p className="text-sm font-medium text-text">Belum ada pesanan</p>
          <p className="text-xs text-text-secondary mt-1">
            Pesanan pada kategori ini belum ditemukan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onTrackClick={(ord) => setSelectedOrderForTracking(ord)}
              onMarkReceived={handleMarkReceived}
              onCancelClick={(ord) => setSelectedOrderForCancel(ord)}
              onRefundClick={(ord) => setSelectedOrderForRefund(ord)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-secondary">
            Menampilkan{" "}
            <span className="font-semibold text-text">{startIndex + 1}</span> -{" "}
            <span className="font-semibold text-text">
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-text">
              {filteredOrders.length}
            </span>{" "}
            pesanan
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background disabled:opacity-40 disabled:pointer-events-none">
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === pageNum
                      ? "bg-primary text-white"
                      : "border border-border text-text hover:bg-background"
                  }`}>
                  {pageNum}
                </button>
              ),
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background disabled:opacity-40 disabled:pointer-events-none">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {selectedOrderForTracking && (
        <TrackingModal
          order={selectedOrderForTracking}
          onClose={() => setSelectedOrderForTracking(null)}
        />
      )}

      {selectedOrderForRefund && (
        <RefundModal
          order={selectedOrderForRefund}
          onClose={() => setSelectedOrderForRefund(null)}
          onSubmit={handleRefundSubmit}
        />
      )}

      {selectedOrderForCancel && (
        <ConfirmModal
          title="Batalkan Pesanan"
          message="Apakah tidak jadi melakukan pembelian?"
          confirmLabel="Ya"
          cancelLabel="Tidak"
          onClose={() => setSelectedOrderForCancel(null)}
          onConfirm={() => handleCancelOrder(selectedOrderForCancel.id)}
        />
      )}
    </div>
  );
}
