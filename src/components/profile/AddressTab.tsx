import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/UseAuth";
import {
  createAddressApi,
  deleteAddressApi,
  fetchAddressesFromBackend,
  getSavedAddresses,
  setDefaultAddressApi,
  updateAddressApi,
  type SavedAddress,
} from "@/lib/addresses";
import { lookupPostalCode } from "@/lib/postalCode";

const EMPTY_FORM: Omit<SavedAddress, "id" | "isDefault"> = {
  label: "Rumah",
  recipientName: "",
  phone: "",
  addressLine: "",
  city: "",
  province: "",
  postalCode: "",
};

const ITEMS_PER_PAGE = 5;

export function AddressTab() {
  const { user } = useAuth();
  const email = user?.email;
  const [addresses, setAddresses] = useState<SavedAddress[]>(() =>
    getSavedAddresses(email, user ?? undefined),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSearchingZip, setIsSearchingZip] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Sync addresses from backend whenever user/email is ready or updated in another tab/browser
  useEffect(() => {
    let isCurrent = true;
    async function loadAddresses() {
      setIsLoading(true);
      try {
        const fetched = await fetchAddressesFromBackend(email, user ?? undefined);
        if (isCurrent && Array.isArray(fetched)) {
          setAddresses(fetched);
        }
      } catch (err) {
        console.warn("Failed to load addresses from backend:", err);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadAddresses();

    const handleSync = () => {
      loadAddresses();
    };

    window.addEventListener("marketplace-address-updated", handleSync);
    return () => {
      isCurrent = false;
      window.removeEventListener("marketplace-address-updated", handleSync);
    };
  }, [email, user]);

  useEffect(() => {
    if (!/^\d{5}$/.test(form.postalCode)) return;

    let isCurrent = true;
    const timer = window.setTimeout(async () => {
      setIsSearchingZip(true);
      try {
        const location = await lookupPostalCode(form.postalCode);
        if (!isCurrent || !location) return;
        setForm((previous) => ({
          ...previous,
          city: location.city || previous.city,
          province: location.province || previous.province,
        }));
      } catch {
        // Keep manually entered city and province when lookup is unavailable.
      } finally {
        if (isCurrent) setIsSearchingZip(false);
      }
    }, 400);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [form.postalCode]);

  const totalPages = Math.max(1, Math.ceil(addresses.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAddresses = addresses.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  function openCreate() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      recipientName: user?.full_name ?? "",
      phone: user?.phone ?? "",
    });
    setIsModalOpen(true);
  }

  function openEdit(address: SavedAddress) {
    setEditingId(address.id);
    setForm({
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine: address.addressLine,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        const existing = addresses.find((a) => a.id === editingId);
        const updated = await updateAddressApi(
          editingId,
          {
            ...form,
            isDefault: existing?.isDefault ?? false,
          },
          email,
        );
        setAddresses((prev) =>
          prev.map((address) => (address.id === editingId ? updated : address)),
        );
      } else {
        const isDefault = addresses.length === 0;
        const created = await createAddressApi(
          {
            ...form,
            isDefault,
          },
          email,
        );
        const next = [...addresses, created];
        setAddresses(next);
        // alamat baru langsung tampil di halaman terakhir
        setCurrentPage(Math.max(1, Math.ceil(next.length / ITEMS_PER_PAGE)));
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving address:", err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAddressApi(id, email);
      const remaining = addresses.filter((address) => address.id !== id);
      if (
        remaining.length > 0 &&
        !remaining.some((address) => address.isDefault)
      ) {
        remaining[0] = { ...remaining[0], isDefault: true };
        await setDefaultAddressApi(remaining[0].id, email);
      }
      setAddresses(remaining);
    } catch (err) {
      console.error("Error deleting address:", err);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await setDefaultAddressApi(id, email);
      setAddresses((prev) =>
        prev.map((address) => ({
          ...address,
          isDefault: address.id === id,
        })),
      );
    } catch (err) {
      console.error("Error setting default address:", err);
    }
  }

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-text">Alamat Saya</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Simpan beberapa alamat untuk mempercepat proses checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90">
          <Plus className="h-4 w-4" />
          Tambah Alamat
        </button>
      </div>

      {isLoading && addresses.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-text-secondary">Memuat daftar alamat...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 py-8 text-center">
          <MapPin className="h-8 w-8 text-text-secondary" />
          <p className="text-sm text-text-secondary">
            Belum ada alamat tersimpan.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {paginatedAddresses.map((address) => (
              <div
                key={address.id}
                className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-text">
                          {address.label}
                        </p>
                        {address.isDefault && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            Utama
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-text">
                        {address.recipientName} · {address.phone}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {address.addressLine}, {address.city},{" "}
                        {address.province} {address.postalCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      aria-label="Edit alamat"
                      className="rounded-md p-2 text-text-secondary hover:bg-background hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(address.id)}
                      aria-label="Hapus alamat"
                      className="rounded-md p-2 text-text-secondary hover:bg-background hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                    <Check className="h-3.5 w-3.5" />
                    Jadikan alamat utama
                  </button>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-text-secondary">
                Menampilkan{" "}
                <span className="font-semibold text-text">
                  {startIndex + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-text">
                  {Math.min(startIndex + ITEMS_PER_PAGE, addresses.length)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-text">
                  {addresses.length}
                </span>{" "}
                alamat
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safeCurrentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background disabled:opacity-40 disabled:pointer-events-none">
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                        safeCurrentPage === pageNum
                          ? "bg-primary text-white"
                          : "border border-border text-text hover:bg-background"
                      }`}>
                      {pageNum}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={safeCurrentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background disabled:opacity-40 disabled:pointer-events-none">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="address-modal-title">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3
                id="address-modal-title"
                className="text-lg font-semibold text-text">
                {editingId ? "Edit Alamat" : "Tambah Alamat"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup"
                className="rounded-md p-1 text-text-secondary hover:bg-background">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                [
                  ["label", "Label alamat", "Rumah, Kantor"],
                  ["recipientName", "Nama penerima", "Nama lengkap"],
                  ["phone", "No. telepon", "08xxxxxxxxxx"],
                  ["postalCode", "Kode pos", "12210"],
                  ["city", "Kota", "Jakarta Selatan"],
                  ["province", "Provinsi", "DKI Jakarta"],
                ] as const
              ).map(([field, label, placeholder]) => (
                <label key={field} className="text-sm font-medium text-text">
                  {label}
                  <input
                    required
                    value={form[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    placeholder={placeholder}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                  />
                  {field === "postalCode" && isSearchingZip && (
                    <Loader2 className="mt-1.5 h-4 w-4 animate-spin text-primary" />
                  )}
                </label>
              ))}
              <label className="text-sm font-medium text-text sm:col-span-2">
                Alamat lengkap
                <textarea
                  required
                  rows={3}
                  value={form.addressLine}
                  onChange={(e) => updateField("addressLine", e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW"
                  className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-background">
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Alamat
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
