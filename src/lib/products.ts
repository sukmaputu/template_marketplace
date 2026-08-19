export type ProductType = "physical" | "digital" | "service";

export interface ProductVariant {
  id: string | number;
  variantName: string;
  stock?: number;
  overridePrice?: number;
  priceDelta?: number;
}

export interface Product {
  id: string | number;
  name: string;
  description?: string;
  image?: string;
  images?: string[];
  type: ProductType;
  basePrice: number;
  comparePrice?: number;
  stock?: number;
  variants?: ProductVariant[];
  rating?: number;
  reviewCount?: number;
  categoryId?: string;
  schedules?: string[];
  levels?: string[];
}

export function getVariantPrice(
  product: Product,
  variant?: ProductVariant,
): number {
  if (!variant) return product.basePrice;
  if (variant.overridePrice !== undefined) return variant.overridePrice;
  if (variant.priceDelta !== undefined)
    return product.basePrice + variant.priceDelta;
  return product.basePrice;
}

export function getDiscountPercent(product: Product): number | undefined {
  if (!product.comparePrice || product.comparePrice <= product.basePrice) {
    return undefined;
  }
  return Math.round(
    ((product.comparePrice - product.basePrice) / product.comparePrice) * 100,
  );
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Pelatihan Desain Grafis",
    description:
      "Belajar dasar hingga mahir desain grafis untuk kebutuhan branding, sosial media, dan promosi bisnis.",
    image: "/products/desin.jpg",
    images: [
      "/products/desin.jpg",
      "/products/data.jpg",
      "/products/desin.jpg",
    ],
    type: "digital",
    basePrice: 50000,
    comparePrice: 100000,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-informasi",
  },
  {
    id: 2,
    name: "Pelatihan Power BI Data Analyst",
    description:
      "Kuasai analisis data dan visualisasi dashboard menggunakan Power BI dari dasar sampai studi kasus nyata.",
    image: "/products/data.jpg",
    images: ["/products/data.jpg", "/products/desin.jpg"],
    type: "digital",
    basePrice: 100000,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-informasi",
  },
  {
    id: 3,
    name: "Kelas UI/UX Design Sprint",
    description:
      "Bangun design system, wireframe, dan prototipe interaktif untuk produk digital modern.",
    image: "/products/data.jpg",
    images: ["/products/data.jpg", "/products/desin.jpg", "/products/data.jpg"],
    type: "digital",
    basePrice: 120000,
    comparePrice: 150000,
    rating: 4,
    reviewCount: 14,
    categoryId: "teknologi-informasi",
  },

  // ===== Keuangan =====
  {
    id: 4,
    name: "Manajemen Pajak",
    description:
      "Pahami dasar perpajakan bisnis, perhitungan, dan pelaporan pajak yang benar sesuai regulasi terbaru.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 90000,
    comparePrice: 120000,
    rating: 0,
    reviewCount: 0,
    categoryId: "keuangan",
  },
  {
    id: 5,
    name: "RAB (Rencana Anggaran Biaya)",
    description:
      "Belajar menyusun rencana anggaran biaya proyek secara akurat, dari estimasi hingga kontrol anggaran.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 110000,
    rating: 0,
    reviewCount: 0,
    categoryId: "keuangan",
  },
  {
    id: 6,
    name: "Akuntansi Dasar untuk Bisnis",
    description:
      "Kuasai pencatatan transaksi, neraca, dan laporan laba rugi untuk kebutuhan bisnis kecil-menengah.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 85000,
    comparePrice: 100000,
    rating: 0,
    reviewCount: 0,
    categoryId: "keuangan",
  },
  {
    id: 7,
    name: "Perencanaan Keuangan Pribadi",
    description:
      "Strategi mengatur pemasukan, tabungan, investasi, dan dana darurat untuk keuangan pribadi yang sehat.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 75000,
    rating: 0,
    reviewCount: 0,
    categoryId: "keuangan",
  },
  {
    id: 8,
    name: "Analisis Laporan Keuangan",
    description:
      "Belajar membaca dan menganalisis laporan keuangan perusahaan untuk pengambilan keputusan bisnis.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 130000,
    comparePrice: 160000,
    rating: 0,
    reviewCount: 0,
    categoryId: "keuangan",
  },

  {
    id: 9,
    name: "Manajemen Asuransi",
    description:
      "Pelajari prinsip dasar manajemen risiko dan pengelolaan produk asuransi secara menyeluruh.",
    image: "/products/desin.jpg",
    type: "digital",
    basePrice: 95000,
    rating: 0,
    reviewCount: 0,
    categoryId: "asuransi",
  },
  {
    id: 10,
    name: "Dasar-Dasar Underwriting Asuransi",
    description:
      "Pahami proses penilaian risiko dan penentuan premi dalam industri asuransi.",
    image: "/products/desin.jpg",
    type: "digital",
    basePrice: 105000,
    comparePrice: 130000,
    rating: 0,
    reviewCount: 0,
    categoryId: "asuransi",
  },
  {
    id: 11,
    name: "Klaim dan Penanganan Asuransi",
    description:
      "Kuasai alur proses klaim, verifikasi, hingga penyelesaian klaim asuransi secara profesional.",
    image: "/products/desin.jpg",
    type: "digital",
    basePrice: 88000,
    rating: 0,
    reviewCount: 0,
    categoryId: "asuransi",
  },
  {
    id: 12,
    name: "Perencanaan Asuransi Jiwa & Kesehatan",
    description:
      "Strategi memilih dan merencanakan proteksi asuransi jiwa dan kesehatan sesuai kebutuhan.",
    image: "/products/desin.jpg",
    type: "digital",
    basePrice: 99000,
    comparePrice: 115000,
    rating: 0,
    reviewCount: 0,
    categoryId: "asuransi",
  },

  {
    id: 13,
    name: "Gambar Teknik",
    description:
      "Belajar membaca dan membuat gambar teknik mesin sesuai standar industri.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 115000,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-mesin",
  },
  {
    id: 14,
    name: "Dasar Mekanika Mesin",
    description:
      "Pahami prinsip kerja mesin, gaya, dan sistem mekanik dasar untuk aplikasi industri.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 100000,
    comparePrice: 125000,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-mesin",
  },
  {
    id: 15,
    name: "Perawatan & Perbaikan Mesin Industri",
    description:
      "Pelajari teknik maintenance preventif dan troubleshooting mesin industri.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 140000,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-mesin",
  },
  {
    id: 16,
    name: "Pengantar CNC dan Manufaktur",
    description:
      "Kenali dasar pemrograman dan pengoperasian mesin CNC untuk proses manufaktur modern.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 150000,
    comparePrice: 180000,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-mesin",
  },
];

export const CATEGORY_DETAILS = [
  {
    id: "teknologi-informasi",
    label: "Teknologi Informasi",
    description:
      "Koleksi kelas dan pelatihan digital populer untuk skill Anda.",
  },
  {
    id: "keuangan",
    label: "Keuangan",
    description:
      "Kelas seputar manajemen keuangan, pajak, dan perencanaan anggaran.",
  },
  {
    id: "asuransi",
    label: "Asuransi",
    description:
      "Pelatihan manajemen risiko dan produk asuransi untuk kebutuhan profesional.",
  },
  {
    id: "teknologi-mesin",
    label: "Teknologi Mesin",
    description:
      "Kelas teknik mesin, gambar teknik, hingga manufaktur dan CNC.",
  },
];
