export interface Product {
  id: string | number;
  name: string;
  description?: string;
  image?: string;
  images?: string[]; // Properti untuk carousel
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  reviewCount?: number;
  storeId?: string;
  storeName?: string;
  categoryId?: string;
  schedules?: string[]; // Opsional — kalau kosong, pakai DEFAULT_SCHEDULES di modal
  levels?: string[]; // Opsional — kalau kosong, pakai DEFAULT_LEVELS di modal
}

export const PRODUCTS: Product[] = [
  // ===== Teknologi Informasi =====
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
    price: 50000,
    originalPrice: 100000,
    discountPercent: 10,
    rating: 0,
    reviewCount: 0,
    storeId: "store-digital",
    storeName: "Studio Digital",
    categoryId: "teknologi-informasi",
  },
  {
    id: 2,
    name: "Pelatihan Power BI Data Analyst",
    description:
      "Kuasai analisis data dan visualisasi dashboard menggunakan Power BI dari dasar sampai studi kasus nyata.",
    image: "/products/data.jpg",
    images: ["/products/data.jpg", "/products/desin.jpg"],
    price: 100000,
    rating: 0,
    reviewCount: 0,
    storeId: "store-data",
    storeName: "Labs Data",
    categoryId: "teknologi-informasi",
  },
  {
    id: 3,
    name: "Kelas UI/UX Design Sprint",
    description:
      "Bangun design system, wireframe, dan prototipe interaktif untuk produk digital modern.",
    image: "/products/data.jpg",
    images: ["/products/data.jpg", "/products/desin.jpg", "/products/data.jpg"],
    price: 120000,
    originalPrice: 150000,
    discountPercent: 20,
    rating: 4,
    reviewCount: 14,
    storeId: "store-creative",
    storeName: "Creative Hub",
    categoryId: "teknologi-informasi",
  },

  // ===== Keuangan =====
  {
    id: 4,
    name: "Manajemen Pajak",
    description:
      "Pahami dasar perpajakan bisnis, perhitungan, dan pelaporan pajak yang benar sesuai regulasi terbaru.",
    image: "/products/data.jpg",
    price: 90000,
    originalPrice: 120000,
    discountPercent: 25,
    rating: 0,
    reviewCount: 0,
    storeId: "store-finance",
    storeName: "Finance Academy",
    categoryId: "keuangan",
  },
  {
    id: 5,
    name: "RAB (Rencana Anggaran Biaya)",
    description:
      "Belajar menyusun rencana anggaran biaya proyek secara akurat, dari estimasi hingga kontrol anggaran.",
    image: "/products/data.jpg",
    price: 110000,
    rating: 0,
    reviewCount: 0,
    storeId: "store-finance",
    storeName: "Finance Academy",
    categoryId: "keuangan",
  },
  {
    id: 6,
    name: "Akuntansi Dasar untuk Bisnis",
    description:
      "Kuasai pencatatan transaksi, neraca, dan laporan laba rugi untuk kebutuhan bisnis kecil-menengah.",
    image: "/products/data.jpg",
    price: 85000,
    originalPrice: 100000,
    discountPercent: 15,
    rating: 0,
    reviewCount: 0,
    storeId: "store-finance",
    storeName: "Finance Academy",
    categoryId: "keuangan",
  },
  {
    id: 7,
    name: "Perencanaan Keuangan Pribadi",
    description:
      "Strategi mengatur pemasukan, tabungan, investasi, dan dana darurat untuk keuangan pribadi yang sehat.",
    image: "/products/data.jpg",
    price: 75000,
    rating: 0,
    reviewCount: 0,
    storeId: "store-finance",
    storeName: "Finance Academy",
    categoryId: "keuangan",
  },
  {
    id: 8,
    name: "Analisis Laporan Keuangan",
    description:
      "Belajar membaca dan menganalisis laporan keuangan perusahaan untuk pengambilan keputusan bisnis.",
    image: "/products/data.jpg",
    price: 130000,
    originalPrice: 160000,
    discountPercent: 19,
    rating: 0,
    reviewCount: 0,
    storeId: "store-finance",
    storeName: "Finance Academy",
    categoryId: "keuangan",
  },

  // ===== Asuransi =====
  {
    id: 9,
    name: "Manajemen Asuransi",
    description:
      "Pelajari prinsip dasar manajemen risiko dan pengelolaan produk asuransi secara menyeluruh.",
    image: "/products/desin.jpg",
    price: 95000,
    rating: 0,
    reviewCount: 0,
    storeId: "store-insurance",
    storeName: "Insurance Institute",
    categoryId: "asuransi",
  },
  {
    id: 10,
    name: "Dasar-Dasar Underwriting Asuransi",
    description:
      "Pahami proses penilaian risiko dan penentuan premi dalam industri asuransi.",
    image: "/products/desin.jpg",
    price: 105000,
    originalPrice: 130000,
    discountPercent: 19,
    rating: 0,
    reviewCount: 0,
    storeId: "store-insurance",
    storeName: "Insurance Institute",
    categoryId: "asuransi",
  },
  {
    id: 11,
    name: "Klaim dan Penanganan Asuransi",
    description:
      "Kuasai alur proses klaim, verifikasi, hingga penyelesaian klaim asuransi secara profesional.",
    image: "/products/desin.jpg",
    price: 88000,
    rating: 0,
    reviewCount: 0,
    storeId: "store-insurance",
    storeName: "Insurance Institute",
    categoryId: "asuransi",
  },
  {
    id: 12,
    name: "Perencanaan Asuransi Jiwa & Kesehatan",
    description:
      "Strategi memilih dan merencanakan proteksi asuransi jiwa dan kesehatan sesuai kebutuhan.",
    image: "/products/desin.jpg",
    price: 99000,
    originalPrice: 115000,
    discountPercent: 14,
    rating: 0,
    reviewCount: 0,
    storeId: "store-insurance",
    storeName: "Insurance Institute",
    categoryId: "asuransi",
  },

  // ===== Teknologi Mesin =====
  {
    id: 13,
    name: "Gambar Teknik",
    description:
      "Belajar membaca dan membuat gambar teknik mesin sesuai standar industri.",
    image: "/products/data.jpg",
    price: 115000,
    rating: 0,
    reviewCount: 0,
    storeId: "store-mesin",
    storeName: "Teknik Mesin Pro",
    categoryId: "teknologi-mesin",
  },
  {
    id: 14,
    name: "Dasar Mekanika Mesin",
    description:
      "Pahami prinsip kerja mesin, gaya, dan sistem mekanik dasar untuk aplikasi industri.",
    image: "/products/data.jpg",
    price: 100000,
    originalPrice: 125000,
    discountPercent: 20,
    rating: 0,
    reviewCount: 0,
    storeId: "store-mesin",
    storeName: "Teknik Mesin Pro",
    categoryId: "teknologi-mesin",
  },
  {
    id: 15,
    name: "Perawatan & Perbaikan Mesin Industri",
    description:
      "Pelajari teknik maintenance preventif dan troubleshooting mesin industri.",
    image: "/products/data.jpg",
    price: 140000,
    rating: 0,
    reviewCount: 0,
    storeId: "store-mesin",
    storeName: "Teknik Mesin Pro",
    categoryId: "teknologi-mesin",
  },
  {
    id: 16,
    name: "Pengantar CNC dan Manufaktur",
    description:
      "Kenali dasar pemrograman dan pengoperasian mesin CNC untuk proses manufaktur modern.",
    image: "/products/data.jpg",
    price: 150000,
    originalPrice: 180000,
    discountPercent: 17,
    rating: 0,
    reviewCount: 0,
    storeId: "store-mesin",
    storeName: "Teknik Mesin Pro",
    categoryId: "teknologi-mesin",
  },
];

// Pastikan bagian ini ada agar tidak terjadi error "export named CATEGORY_DETAILS"
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
