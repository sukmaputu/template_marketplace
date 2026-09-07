import { createContext } from "react";

export interface AuthUser {
  full_name: string;
  email: string;
  phone?: string;
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

export const AuthContext = createContext<AuthContextValue | null>(null);
