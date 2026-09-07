import type { Voucher } from "@/components/profile/types";

export const LOYALTY_REWARD_THRESHOLD = 20;

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
