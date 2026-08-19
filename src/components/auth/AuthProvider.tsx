import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext, type AuthUser } from "@/components/auth/AuthContext";

const DEMO_ACCOUNT = {
  email: "sukma@email.com",
  password: "sukma123",
  full_name: "I Putu Sukma",
  phone: "+62 812 3456 7890",
  username: "sukmasukma",
};

const STORAGE_KEY = "auth-user";

function isValidStoredUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    // Cek 'full_name' bukan 'name'
    typeof record.full_name === "string" &&
    typeof record.email === "string" &&
    record.email.toString().trim().toLowerCase() === DEMO_ACCOUNT.email
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

  function login(email: string, password: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail === DEMO_ACCOUNT.email &&
      password === DEMO_ACCOUNT.password
    ) {
      // Konstruksi nextUser menggunakan full_name
      const nextUser: AuthUser = {
        full_name: DEMO_ACCOUNT.full_name,
        email: DEMO_ACCOUNT.email,
        phone: DEMO_ACCOUNT.phone,
        username: DEMO_ACCOUNT.username,
      };
      setUser(nextUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      return true;
    }

    return false;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
