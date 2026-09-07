import type { Order } from "@/components/profile/types";

const ORDER_HISTORY_KEY = "marketplace-order-history";

export function getStoredOrders(): Order[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(ORDER_HISTORY_KEY);
    if (!value) return [];

    const orders = JSON.parse(value) as unknown;
    return Array.isArray(orders) ? (orders as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order) {
  if (typeof window === "undefined") return;

  const orders = getStoredOrders().filter((item) => item.id !== order.id);
  window.localStorage.setItem(
    ORDER_HISTORY_KEY,
    JSON.stringify([order, ...orders]),
  );
  window.dispatchEvent(new Event("order-history-updated"));
}
