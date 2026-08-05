export interface Product {
  id: string | number;
  name: string;
  description?: string;
  image?: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  reviewCount?: number;
  storeId?: string;
  storeName?: string;
  categoryId?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Pelatihan Desain Grafis",
    description:
      "Belajar dasar hingga mahir desain grafis untuk kebutuhan branding, sosial media, dan promosi bisnis.",
    image: "/products/desin.jpg",
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
    price: 120000,
    originalPrice: 150000,
    discountPercent: 20,
    rating: 4,
    reviewCount: 14,
    storeId: "store-creative",
    storeName: "Creative Hub",
    categoryId: "teknologi-informasi",
  },
];

export const CATEGORY_DETAILS = [
  {
    id: "teknologi-informasi",
    label: "Teknologi Informasi",
    description:
      "Koleksi kelas dan pelatihan digital populer untuk skill Anda.",
  },
];
