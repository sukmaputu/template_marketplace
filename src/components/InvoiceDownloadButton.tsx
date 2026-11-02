import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import {
  InvoiceDocument,
  type InvoiceCustomer,
  type InvoiceItem,
} from "@/components/Invoicedocument";
import type { CheckoutOrderState } from "@/lib/checkoutFlow";

interface InvoiceDownloadButtonProps {
  orderState: CheckoutOrderState;
  className?: string;
}

export function InvoiceDownloadButton({
  orderState,
  className,
}: InvoiceDownloadButtonProps) {
  const items: InvoiceItem[] = orderState.items.map((item) => ({
    name: `${item.name} (${item.variant})`,
    quantity: item.quantity,
    price: item.price,
  }));
  const subtotal =
    orderState.subtotal ??
    orderState.items.reduce((total, item) => total + item.price * item.quantity, 0);
  const taxAmount = orderState.taxAmount ?? 0;
  const discountAmount = orderState.discountAmount ?? 0;
  const packagingFee =
    orderState.packagingFee ??
    Math.max(0, orderState.totalPaid - subtotal - taxAmount + discountAmount);
  const customer: InvoiceCustomer = orderState.customer ?? {
    name: "-",
    email: "-",
    phone: "-",
  };

  return (
    <PDFDownloadLink
      document={
        <InvoiceDocument
          orderId={orderState.orderId}
          date={orderState.invoiceDate ?? new Date().toLocaleString("id-ID")}
          customer={customer}
          items={items}
          subtotal={subtotal}
          packagingFee={packagingFee}
          taxAmount={taxAmount}
          taxLabel={orderState.taxLabel}
          discountAmount={discountAmount}
          voucherCode={orderState.voucherCode}
          currency={orderState.currency}
          exchangeRate={orderState.exchangeRate}
        />
      }
      fileName={`invoice-${orderState.orderId}.pdf`}
      className={className}>
      {({ loading }) => (
        <>
          <Download className="h-4 w-4" />
          {loading ? "Menyiapkan invoice..." : "Download Invoice"}
        </>
      )}
    </PDFDownloadLink>
  );
}
