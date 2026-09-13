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

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
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
