import type { Voucher } from "@/components/profile/types";

export const LOYALTY_REWARD_THRESHOLD = 20;

export const CHECKOUT_VOUCHERS: Voucher[] = [
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
];

export const LOYALTY_REWARD_VOUCHER: Voucher = {
  id: "loyalty-20",
  code: "LOYALTY20",
  title: "Reward Loyalti",
  discount_label: "Rp 10.000",
  discount_amount: 10000,
  min_purchase: "Tukar 20 poin loyalti",
  expires_at: "Berlaku saat poin mencukupi",
  status: "aktif",
};
