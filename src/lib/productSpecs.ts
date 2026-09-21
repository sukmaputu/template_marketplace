import type { ProductSpec } from "@/lib/products";

/**
 * Spesifikasi produk sementara (hardcode) karena backend belum menyediakannya.
 *
 * Kunci = SKU produk dari backend (stabil & mudah dibaca).
 * Baris "Kategori" dan "Stok" TIDAK perlu ditulis di sini,
 * karena diambil otomatis dari data produk.
 *
 * Kalau backend nanti mengirim `specs`, data dari backend yang dipakai
 * dan file ini bisa dihapus.
 */
export const PRODUCT_SPECS: Record<string, ProductSpec[]> = {
  // Crew Neck Cotton Tee
  "SKU-2001": [
    { label: "Bahan", value: "Katun organik" },
    { label: "Gramasi", value: "220 gsm" },
    { label: "Model Kerah", value: "Crew neck" },
    { label: "Jahitan", value: "Kuat dan tahan lama" },
    { label: "Karakter Kain", value: "Breathable, nyaman untuk sehari-hari" },
  ],

  // Fleece-Lined Hoodie
  "SKU-2002": [
    { label: "Bahan", value: "Fleece brushed-back" },
    { label: "Gramasi", value: "360 gsm" },
    { label: "Model", value: "Hoodie dengan kantong kanguru" },
    { label: "Tudung", value: "Double-layer" },
    { label: "Manset", value: "Rib" },
    { label: "Cocok Untuk", value: "Musim dingin / cuaca dingin" },
  ],

  // Retro Running Sneakers
  "SKU-2003": [
    { label: "Bahan", value: "Suede dan mesh" },
    { label: "Midsole", value: "EVA, empuk dan responsif" },
    { label: "Gaya", value: "Retro running" },
    { label: "Karakter", value: "Ringan dan suportif untuk dipakai seharian" },
  ],

  // Washed Denim Jacket
  "SKU-2004": [
    { label: "Bahan", value: "Denim stone-washed 12 oz" },
    { label: "Model", value: "Trucker, lima saku" },
    { label: "Kancing", value: "Metal shank" },
    { label: "Penutup", value: "Kancing depan" },
  ],

  // Three-Seater Fabric Sofa
  "SKU-3001": [
    { label: "Kapasitas", value: "3 dudukan" },
    { label: "Bahan", value: "Kain performance tahan lama" },
    { label: "Rangka", value: "Kayu keras kiln-dried" },
    { label: "Sarung", value: "Bisa dilepas dan dicuci mesin" },
    { label: "Gaya", value: "Mid-century" },
  ],

  // Arched Floor Lamp
  "SKU-3002": [
    { label: "Bahan", value: "Baja powder-coated" },
    { label: "Model", value: "Arch (lengkung)" },
    { label: "Lampu", value: "LED 2700K warm white" },
    { label: "Fitur", value: "Dapat diredupkan (dimmable)" },
  ],

  // Linen Bedding Set — Queen
  "SKU-3003": [
    { label: "Ukuran", value: "Queen" },
    { label: "Bahan", value: "100% linen flax Prancis" },
    { label: "Isi Paket", value: "1 sarung duvet, 2 sarung bantal" },
    { label: "Karakter Kain", value: "Breathable dan mengatur suhu alami" },
  ],

  // Stainless Cookware Set 5pc
  "SKU-3004": [
    {
      label: "Isi Paket",
      value: "5 pcs (wajan, panci saus, panci besar, tutup)",
    },
    { label: "Bahan", value: "Stainless tri-ply, inti aluminium" },
    { label: "Kompatibel", value: "Kompor induksi dan oven" },
    { label: "Gagang", value: "Tahan panas" },
  ],

  // Laptop Backpack 28L
  "SKU-4001": [
    { label: "Kapasitas", value: "28 liter" },
    { label: "Bahan", value: "Nilon 900D berlapis coating" },
    { label: "Model", value: "Roll-top, tahan cuaca" },
    { label: "Kompartemen Laptop", value: 'Hingga 16", lapis fleece' },
    { label: "Fitur", value: "Kantong botol eksternal, tali bahu ergonomis" },
  ],

  // Polarized Aviator Sunglasses
  "SKU-4002": [
    { label: "Model", value: "Aviator teardrop" },
    { label: "Lensa", value: "Polarized UV400, anti-gores" },
    { label: "Rangka", value: "Stainless steel ringan" },
  ],
};

export function getProductSpecs(sku?: string): ProductSpec[] {
  if (!sku) return [];
  return PRODUCT_SPECS[sku] ?? [];
}
