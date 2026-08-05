import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, MapPin, Phone, User } from "lucide-react";

interface FormValues {
  name: string;
  phone: string;
  address: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;

const INITIAL_VALUES: FormValues = {
  name: "",
  phone: "",
  address: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function SignUpPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = "Nama wajib diisi.";
    }

    if (!values.phone.trim()) {
      nextErrors.phone = "No. Telepon wajib diisi.";
    } else if (!PHONE_REGEX.test(values.phone.trim())) {
      nextErrors.phone =
        "Format nomor telepon tidak valid. Contoh: 08123456789.";
    }

    if (!values.address.trim()) {
      nextErrors.address = "Alamat rumah wajib diisi.";
    }

    if (!values.email.trim()) {
      nextErrors.email = "Email wajib diisi.";
    } else if (!EMAIL_REGEX.test(values.email.trim())) {
      nextErrors.email = "Format email tidak valid.";
    }

    if (!values.password) {
      nextErrors.password = "Password wajib diisi.";
    } else if (values.password.length < 8) {
      nextErrors.password = "Password minimal 8 karakter.";
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = "Konfirmasi password wajib diisi.";
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Konfirmasi password tidak cocok.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    console.log("Sign up:", values);
    navigate("/sign-in");
  }

  const fieldClass = (hasError?: string) =>
    `w-full rounded-lg border bg-background py-2.5 pl-10 pr-10 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary ${
      hasError ? "border-red-500" : "border-border"
    }`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="mx-auto h-12 w-auto object-contain"
          />
          <h1 className="mt-4 text-xl font-bold text-text">Buat Akun Baru</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Isi data diri kamu untuk mulai berbelanja.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-text">
              Nama
            </label>
            <div className="relative mt-1.5">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                id="name"
                type="text"
                value={values.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Nama lengkap"
                className={fieldClass(errors.name).replace("pr-10", "pr-3")}
              />
            </div>
            {errors.name ? (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-medium text-text">
              No. Telepon
            </label>
            <div className="relative mt-1.5">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                id="phone"
                type="tel"
                value={values.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="08123456789"
                className={fieldClass(errors.phone).replace("pr-10", "pr-3")}
              />
            </div>
            {errors.phone ? (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="address" className="text-sm font-medium text-text">
              Alamat Rumah
            </label>
            <div className="relative mt-1.5">
              <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-text-secondary" />
              <textarea
                id="address"
                rows={2}
                value={values.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Nama jalan, kelurahan, kecamatan, kota"
                className={`w-full resize-none rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary ${
                  errors.address ? "border-red-500" : "border-border"
                }`}
              />
            </div>
            {errors.address ? (
              <p className="mt-1 text-xs text-red-600">{errors.address}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-text">
              Alamat Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="nama@email.com"
                className={fieldClass(errors.email).replace("pr-10", "pr-3")}
              />
            </div>
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-text">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder="Minimal 8 karakter"
                className={fieldClass(errors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text">
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-text">
              Konfirmasi Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={values.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                placeholder="Ulangi password"
                className={fieldClass(errors.confirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={
                  showConfirmPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text">
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.confirmPassword}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Daftar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Sudah punya akun?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:opacity-80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
