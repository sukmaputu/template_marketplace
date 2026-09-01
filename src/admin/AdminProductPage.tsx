import { useRef, useState, type FormEvent } from "react";
import { ImagePlus, Package, Plus, X } from "lucide-react";
import { PRODUCT_ROWS, type ProductRow } from "@/lib/products";

const INITIAL_PRODUCTS = PRODUCT_ROWS.slice(0, 2);

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  discountPercent: string;
  imagePreview: string | null;
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  description: "",
  price: "",
  discountPercent: "",
  imagePreview: null,
};

export default function AdminProductPage() {
  const [products, setProducts] = useState<ProductRow[]>(INITIAL_PRODUCTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openModal() {
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, imagePreview: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price.trim()) return;

    const productId = String(Date.now());
    const basePrice = Number(form.price) || 0;
    const discountPercent = form.discountPercent
      ? Number(form.discountPercent)
      : 0;
    const newProduct: ProductRow = {
      id: productId,
      category_id: "teknologi-informasi",
      type: "digital",
      sku: `SKU-${productId}`,
      name: form.name.trim(),
      slug: form.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      summary: form.description.trim(),
      description: form.description.trim(),
      cover_image_url: form.imagePreview,
      base_price: basePrice,
      compare_price:
        discountPercent > 0 && discountPercent < 100
          ? Math.round(basePrice / (1 - discountPercent / 100))
          : null,
      stock: 0,
      is_featured: false,
      status: "published",
      average_rating: 0,
      review_count: 0,
      images: form.imagePreview
        ? [
            {
              id: `${productId}-image-1`,
              product_id: productId,
              image_url: form.imagePreview,
              sort_order: 0,
            },
          ]
        : [],
    };

    setProducts((prev) => [newProduct, ...prev]);
    closeModal();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Produk</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Total {products.length} produk aktif di marketplace.
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Tambahkan Produk
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-xl border border-border bg-surface p-3">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-background">
              {product.compare_price &&
              product.compare_price > product.base_price ? (
                <span className="absolute left-0 top-0 z-10 rounded-br-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white">
                  -
                  {Math.round(
                    ((product.compare_price - product.base_price) /
                      product.compare_price) *
                      100,
                  )}
                  %
                </span>
              ) : null}
              {product.cover_image_url ? (
                <img
                  src={product.cover_image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-8 w-8 text-text-secondary" />
                </div>
              )}
            </div>
            <p className="mt-2.5 line-clamp-2 text-sm font-semibold text-text">
              {product.name}
            </p>
            <p className="mt-1 text-sm font-bold text-primary">
              {formatRupiah(product.base_price)}
            </p>
          </div>
        ))}
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">Tambahkan Produk</h2>
              <button
                onClick={closeModal}
                aria-label="Tutup"
                className="rounded-full p-1.5 text-text-secondary hover:bg-background">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-text">
                  Gambar Produk
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1.5 flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-background">
                  {form.imagePreview ? (
                    <img
                      src={form.imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1.5 text-text-secondary">
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs">Klik untuk unggah gambar</span>
                    </span>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="product-name"
                  className="text-sm font-medium text-text">
                  Nama Produk
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Contoh: Pelatihan Desain Grafis"
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="product-description"
                  className="text-sm font-medium text-text">
                  Deskripsi
                </label>
                <textarea
                  id="product-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Jelaskan produk secara singkat..."
                  className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="product-price"
                    className="text-sm font-medium text-text">
                    Harga (Rp)
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price: e.target.value }))
                    }
                    placeholder="50000"
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="product-discount"
                    className="text-sm font-medium text-text">
                    Diskon %{" "}
                    <span className="text-text-secondary">(opsional)</span>
                  </label>
                  <input
                    id="product-discount"
                    type="number"
                    min={0}
                    max={100}
                    value={form.discountPercent}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        discountPercent: e.target.value,
                      }))
                    }
                    placeholder="10"
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-text hover:bg-background">
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-90">
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
