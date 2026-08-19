export interface Notification {
  id: string | number;
  title: string;
  description: string;
  time: string;
  is_read: boolean;
  read_at?: string | null;
  notification_type?: string;
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Pesanan dikonfirmasi",
    description: "Pesanan #12345 sedang diproses penjual.",
    time: "10 menit lalu",
    is_read: false,
    notification_type: "order",
  },
  {
    id: 2,
    title: "Promo spesial untukmu",
    description: "Diskon 20% untuk kategori Business & Promotion.",
    time: "2 jam lalu",
    is_read: false,
    notification_type: "promo",
  },
  {
    id: 3,
    title: "Pembayaran berhasil",
    description: "Pembayaran pesanan #12210 telah diterima.",
    time: "1 hari lalu",
    is_read: true,
    notification_type: "payment",
  },
];
