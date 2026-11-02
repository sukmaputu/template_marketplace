export interface CheckoutOrderState {
  totalPaid: number;
  orderId: string;
  currency?: "IDR" | "USD";
  exchangeRate?: number | null;
  orderUuid?: string;
  isManual?: boolean;
  proofSubmitted?: boolean;
  showProcessingAnimation?: boolean;
  loyaltyPointsEarned?: number;
  invoiceDate?: string;
  subtotal?: number;
  packagingFee?: number;
  taxAmount?: number;
  taxLabel?: string;
  discountAmount?: number;
  voucherCode?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  paymentMethod?: {
    name: string;
    gateway_code: string;
    bank_name?: string;
    account_number?: string;
    account_holder?: string;
    account_holder_name?: string;
    instructions?: string;
  };
  items: Array<{
    productId: string;
    name: string;
    variant: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
}

const CHECKOUT_ORDER_KEY = "marketplace-checkout-order";

export function formatCheckoutPrice(
  value: number,
  currency: "IDR" | "USD" = "IDR",
  exchangeRate?: number | null,
): string {
  const convertedValue =
    currency === "USD" && exchangeRate
      ? value * exchangeRate
      : value;

  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(convertedValue);
}

export function saveCheckoutOrderState(state: CheckoutOrderState): void {
  const persistentState = { ...state };
  delete persistentState.showProcessingAnimation;
  sessionStorage.setItem(CHECKOUT_ORDER_KEY, JSON.stringify(persistentState));
}

export function loadCheckoutOrderState(): CheckoutOrderState | null {
  try {
    const saved = sessionStorage.getItem(CHECKOUT_ORDER_KEY);
    return saved ? (JSON.parse(saved) as CheckoutOrderState) : null;
  } catch {
    return null;
  }
}
