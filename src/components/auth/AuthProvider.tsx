import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext, type AuthUser } from "@/components/auth/AuthContext";
import { api, removeAuthToken, setAuthToken } from "@/lib/api";

const DEMO_ACCOUNT = {
  email: "sukma@email.com",
  password: "sukma123",
  full_name: "I Putu Sukma",
  phone: "+62 812 3456 7890",
  address: "Jl. Contoh Alamat No. 123, Jakarta Selatan",
  username: "sukmasukma",
};

const STORAGE_KEY = "auth-user";

function isValidStoredUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.full_name === "string" &&
    typeof record.email === "string"
  );
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!isValidStoredUser(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = loadStoredUser();
    return storedUser;
  });

  async function login(email: string, password: string): Promise<boolean> {
    const normalizedIdentifier = email.trim().toLowerCase();

    // 1. Try Backend API first
    try {
      const res = await api.post<{
        success: boolean;
        data?: {
          token?: string;
          access_token?: string;
          akun?: {
            uuid?: string;
            email: string;
            username?: string;
            full_name?: string;
            phone?: string;
            address?: string;
          };
        };
      }>("/auth/login", {
        identifier: normalizedIdentifier,
        password,
      });

      const token = res.data?.data?.token || res.data?.data?.access_token;
      const akun = res.data?.data?.akun;

      if (token && akun) {
        setAuthToken(token);
        const nextUser: AuthUser = {
          full_name: akun.full_name || akun.username || DEMO_ACCOUNT.full_name,
          email: akun.email,
          phone: akun.phone || DEMO_ACCOUNT.phone,
          username: akun.username || DEMO_ACCOUNT.username,
          address: akun.address || DEMO_ACCOUNT.address,
        };
        setUser(nextUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        return true;
      }
    } catch {
      // Backend offline or auth failed, fall through to demo check
    }

    // 2. Demo fallback
    if (
      normalizedIdentifier === DEMO_ACCOUNT.email &&
      password === DEMO_ACCOUNT.password
    ) {
      const nextUser: AuthUser = {
        full_name: DEMO_ACCOUNT.full_name,
        email: DEMO_ACCOUNT.email,
        phone: DEMO_ACCOUNT.phone,
        username: DEMO_ACCOUNT.username,
        address: DEMO_ACCOUNT.address,
      };
      setUser(nextUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      return true;
    }

    return false;
  }

  function logout() {
    setUser(null);
    removeAuthToken();
    localStorage.removeItem(STORAGE_KEY);
  }

  function addLoyaltyPoints(points: number) {
    if (!points || points <= 0) return;

    setUser((prev) => {
      if (!prev) return prev;

      const nextUser: AuthUser = {
        ...prev,
        loyalty_points: (prev.loyalty_points ?? 0) + points,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      addLoyaltyPoints,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
