import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

interface FormErrors {
  email?: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email wajib diisi.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Format email tidak valid.";
    }

    if (!password) {
      nextErrors.password = "Password wajib diisi.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // TODO: sambungkan ke API sign in kamu
    console.log("Sign in:", { email, password });
    navigate("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="mx-auto h-12 w-auto object-contain"
          />
          <h1 className="mt-4 text-xl font-bold text-text">Masuk ke Akun</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Selamat datang kembali! Silakan masuk untuk melanjutkan.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-text">
              Alamat Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary ${
                  errors.email ? "border-red-500" : "border-border"
                }`}
              />
            </div>
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            ) : null}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-text">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-primary hover:opacity-80">
                Lupa password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-10 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary ${
                  errors.password ? "border-red-500" : "border-border"
                }`}
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

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Masuk
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs ">
            <span className="bg-surface px-2 text-text-secondary">
              Atau lanjut dengan
            </span>
          </div>
        </div>

        {/* Google Button */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-text hover:bg-gray-50 transition-colors dark:hover:bg-white/5">
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Belum punya akun?{" "}
          <Link
            to="/sign-up"
            className="font-medium text-primary hover:opacity-80">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
