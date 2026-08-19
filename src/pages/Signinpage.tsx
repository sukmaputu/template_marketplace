import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/components/auth/UseAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface LocationWithState {
  pathname: string;
  state?: unknown;
}

interface SignInLocationState {
  from?: LocationWithState;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const state = location.state as SignInLocationState;
  const from = state?.from;
  const redirectTo = from?.pathname ?? "/";
  const recoveryState = from?.state;

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

    const success = login(email, password);

    if (!success) {
      setErrors({ general: "Email atau password salah." });
      return;
    }
    navigate(redirectTo, {
      replace: true,
      state: recoveryState,
    });
  }

  function handleGoogleSignIn() {
    console.log("TODO: integrasikan Google OAuth di sini");
    setErrors({ general: "Login dengan Google belum tersedia." });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8">
        <div className="text-center">
          <img
            src="/logo/logo.png"
            alt="Logo"
            className="mx-auto h-12 w-auto object-contain"
          />
          <h1 className="mt-4 text-xl font-bold text-text">Masuk ke Akun</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Selamat datang kembali! Silakan masuk untuk melanjutkan.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
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

          {errors.general ? (
            <p className="text-xs text-red-600">{errors.general}</p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Masuk
          </button>
        </form>

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

        <GoogleSignInButton onClick={handleGoogleSignIn} />

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
