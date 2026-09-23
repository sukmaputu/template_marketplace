import { createContext } from "react";
import { useContext } from "react";

export interface AuthUser {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  username?: string;
  created_at?: string;
  loyalty_points?: number;
}

export interface RegisterParams {
  full_name: string;
  email: string;
  password: string;
  username?: string;
  phone?: string;
  address?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean> | boolean;
  register: (
    params: RegisterParams,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  addLoyaltyPoints: (points: number) => void;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
