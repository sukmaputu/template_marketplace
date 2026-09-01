export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  id: string;
  product_name_snapshot: string;
  variant_name_snapshot: string;
  unit_price: number;
  quantity: number;
  image?: string;
}

export interface TrackingStep {
  title: string;
  description: string;
  time: string;
  completed: boolean;
}

export interface Order {
  id: string;
  status: OrderStatus;
  date: string;
  grand_total: number;
  items: OrderItem[];
  cancelDeadline?: string;
  refundDeadline?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingTimeline?: TrackingStep[];
  refundReason?: string;
  refundNote?: string;
}

export const REFUND_REASONS = [
  "Produk/akses tidak sesuai deskripsi",
  "Tidak jadi digunakan",
  "Masalah teknis, tidak bisa diakses",
  "Salah beli",
  "Alasan lainnya",
] as const;

export type TabKey = "data-diri" | "riwayat-pembelian";
