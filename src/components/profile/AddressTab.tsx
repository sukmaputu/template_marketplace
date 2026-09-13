import { useEffect, useState } from "react";
import { Check, Loader2, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/auth/UseAuth";
import {
  createAddressId,
  getSavedAddresses,
  saveSavedAddresses,
  setDefaultAddress,
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

export function AddressTab() {
  const { user } = useAuth();
  const email = user?.email;
  const [addresses, setAddresses] = useState<SavedAddress[]>(() =>
    getSavedAddresses(email, user ?? undefined),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSearchingZip, setIsSearchingZip] = useState(false);

  useEffect(() => {
    setAddresses(getSavedAddresses(email, user ?? undefined));
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

  function updateAddresses(next: SavedAddress[]) {
    setAddresses(next);
    saveSavedAddresses(next, email);
  }

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const existing = editingId
      ? addresses.find((address) => address.id === editingId)
      : undefined;
    const nextAddress: SavedAddress = {
      ...form,
      id: editingId ?? createAddressId(),
      isDefault: existing?.isDefault ?? addresses.length === 0,
    };
    const next = editingId
      ? addresses.map((address) =>
          address.id === editingId ? nextAddress : address,
        )
      : [...addresses, nextAddress];
    updateAddresses(next);
    setIsModalOpen(false);
  }

  function handleDelete(id: string) {
    const remaining = addresses.filter((address) => address.id !== id);
    if (
      remaining.length > 0 &&
      !remaining.some((address) => address.isDefault)
    ) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    updateAddresses(remaining);
  }

  function handleSetDefault(id: string) {
    updateAddresses(setDefaultAddress(addresses, id));
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

      {addresses.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 py-8 text-center">
          <MapPin className="h-8 w-8 text-text-secondary" />
          <p className="text-sm text-text-secondary">
            Belum ada alamat tersimpan.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text">{address.label}</p>
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
                      {address.addressLine}, {address.city}, {address.province}{" "}
                      {address.postalCode}
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
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                Simpan Alamat
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
