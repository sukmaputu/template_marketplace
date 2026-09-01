export function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

import type { Order } from "./types";

export function isRefundEligible(order: Order): boolean {
  const eligibleStatus =
    order.status === "completed" || order.status === "processing";
  if (!eligibleStatus) return false;

  if (!order.refundDeadline) return true;

  return new Date(order.refundDeadline).getTime() > Date.now();
}
