import { createContext } from "react";

export interface AuthUser {
  full_name: string;
  email: string;
  phone?: string;
  username?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
