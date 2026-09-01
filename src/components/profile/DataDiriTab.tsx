import { useState } from "react";
import { AtSign, Mail, Phone, Save, User } from "lucide-react";
import { useAuth } from "@/components/auth/UseAuth";

export function DataDiriTab() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    username: user?.username || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fields = [
    {
      label: "Nama Lengkap",
      name: "full_name",
      value: formData.full_name,
      icon: User,
    },
    {
      label: "Username",
      name: "username",
      value: formData.username || "Belum diatur",
      icon: AtSign,
    },
    {
      label: "No. Telepon",
      name: "phone",
      value: formData.phone || "Belum diatur",
      icon: Phone,
    },
    { label: "Alamat Email", name: "email", value: formData.email, icon: Mail },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-text">Data Diri</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Informasi pribadi akun Anda sesuai data sistem.
      </p>

      <div className="mt-6 space-y-5">
        {fields.map(({ label, name, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background border border-border">
              <Icon className="h-4 w-4 text-text-secondary" />
            </span>
            <div className="flex-1">
              <p className="text-xs text-text-secondary">{label}</p>
              {isEditing ? (
                <input
                  type="text"
                  name={name}
                  value={value === "Belum diatur" ? "" : value}
                  onChange={handleInputChange}
                  placeholder={`Masukkan ${label}`}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-text">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Edit Profil
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-background">
              Batal
            </button>
          </>
        )}
      </div>
    </div>
  );
}
