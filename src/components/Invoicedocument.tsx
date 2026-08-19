import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

export interface InvoiceCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface InvoiceDocumentProps {
  orderId: string;
  date: string;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  subtotal: number;
  packagingFee: number;
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 20,
    height: 20,
  },
  brandName: {
    fontSize: 13,
    fontWeight: 700,
  },
  brandSub: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 1,
  },
  dateText: {
    fontSize: 9,
    color: "#64748b",
  },
  cpText: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginTop: 14,
    marginBottom: 14,
  },
  invoiceId: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    color: "#64748b",
    width: 90,
  },
  infoValue: {
    fontWeight: 500,
  },
  table: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  colNo: { width: "10%" },
  colItem: { width: "65%" },
  colQty: { width: "25%", textAlign: "right" },
  tableHeaderText: {
    fontWeight: 700,
    fontSize: 9,
  },
  summarySection: {
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    color: "#64748b",
  },
  summaryValue: {
    fontWeight: 700,
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginTop: 4,
    paddingTop: 8,
  },
  footerNote: {
    marginTop: 28,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

export function InvoiceDocument({
  orderId,
  date,
  customer,
  items,
  subtotal,
  packagingFee,
}: InvoiceDocumentProps) {
  const grandTotal = subtotal + packagingFee;

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.brandRow}>
              <Image src="/logo/logo.png" style={styles.logo} />
              <View>
                <Text style={styles.brandName}>Nama Marketplace</Text>
                <Text style={styles.brandSub}>
                  MARKETPLACE PELATIHAN & KURSUS
                </Text>
              </View>
            </View>
            <Text style={styles.cpText}>CP : {customer.phone}</Text>
          </View>
          <Text style={styles.dateText}>Date: {date}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.invoiceId}>{orderId}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>: {customer.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>: {customer.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone Number</Text>
          <Text style={styles.infoValue}>: {customer.phone}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colNo, styles.tableHeaderText]}>No</Text>
            <Text style={[styles.colItem, styles.tableHeaderText]}>Item</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>
              Quantity
            </Text>
          </View>
          {items.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.tableRow}>
              <Text style={styles.colNo}>{index + 1}</Text>
              <Text style={styles.colItem}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}x</Text>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatRupiah(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Packaging Fee</Text>
            <Text style={styles.summaryValue}>
              {formatRupiah(packagingFee)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalDivider]}>
            <Text style={{ fontWeight: 700 }}>Total</Text>
            <Text style={{ fontWeight: 700 }}>{formatRupiah(grandTotal)}</Text>
          </View>
        </View>

        <Text style={styles.footerNote}>
          Invoice ini dibuat otomatis dan sah tanpa tanda tangan basah.
        </Text>
      </Page>
    </Document>
  );
}
