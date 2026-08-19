import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, Eye, EyeOff, Lock } from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

interface NotificationPrefs {
  emailPromo: boolean;
  orderUpdates: boolean;
  classReminder: boolean;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
      </div>
      <button
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full border-0 p-0 transition-colors ${
          checked ? "bg-primary" : "bg-border"
        }`}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    emailPromo: true,
    orderUpdates: true,
    classReminder: true,
  });

  function toggleNotification(key: keyof NotificationPrefs) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordSuccess(false);
    setPasswordError("");

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordError("Semua kolom wajib diisi.");
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("Konfirmasi password tidak cocok.");
      return;
    }

    console.log("Ganti password:", passwordForm);
    setPasswordSuccess(true);
    setPasswordForm({ current: "", next: "", confirm: "" });
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <h1 className="text-2xl font-bold text-text">Pengaturan</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Kelola keamanan akun dan preferensi notifikasi kamu.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-text">
              Ganti Password
            </h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-text">
                Password Saat Ini
              </label>
              <input
                type="password"
                value={passwordForm.current}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, current: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text">
                Password Baru
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.next}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, next: e.target.value }))
                  }
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 pr-10 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text">
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text">
                Konfirmasi Password Baru
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, confirm: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
              />
            </div>

            {passwordError ? (
              <p className="text-xs text-red-600">{passwordError}</p>
            ) : null}
            {passwordSuccess ? (
              <p className="text-xs text-secondary">
                Password berhasil diubah.
              </p>
            ) : null}

            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              Simpan Password
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-text">Notifikasi</h2>
          </div>

          <div className="mt-2 divide-y divide-border">
            <ToggleRow
              label="Promo & Penawaran Email"
              description="Dapatkan info diskon dan promo kelas terbaru lewat email."
              checked={notifications.emailPromo}
              onChange={() => toggleNotification("emailPromo")}
            />
            <ToggleRow
              label="Update Pesanan"
              description="Notifikasi status pesanan: diproses, dikonfirmasi, selesai."
              checked={notifications.orderUpdates}
              onChange={() => toggleNotification("orderUpdates")}
            />
            <ToggleRow
              label="Reminder Kelas"
              description="Pengingat sebelum jadwal kelas yang kamu ikuti dimulai."
              checked={notifications.classReminder}
              onChange={() => toggleNotification("classReminder")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
