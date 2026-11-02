import { useEffect, useMemo, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { AuthContext, type AuthUser, type RegisterParams } from "@/components/auth/AuthContext";
import { api, getAuthToken, removeAuthToken, setAuthToken } from "@/lib/api";
import { createAddressApi } from "@/lib/addresses";
import { chatService } from "@/services/chat.service";
import { websocketService } from "@/lib/websocket";
import { clearStoredOrders } from "@/lib/orderHistory";

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

  useEffect(() => {
    if (user?.email) {
      chatService.transferGuestHistory({
        id: user.username || user.email,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
      });
    }
  }, [user]);

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
            loyalty_points?: number;
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
          id: akun.uuid,
          full_name: akun.full_name || akun.username || DEMO_ACCOUNT.full_name,
          email: akun.email,
          phone: akun.phone || DEMO_ACCOUNT.phone,
          username: akun.username || DEMO_ACCOUNT.username,
          address: akun.address || DEMO_ACCOUNT.address,
          loyalty_points: akun.loyalty_points ?? 0,
        };
        setUser(nextUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        window.dispatchEvent(new Event("order-history-updated"));
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
      window.dispatchEvent(new Event("order-history-updated"));
      chatService.transferGuestHistory({
        id: nextUser.username || nextUser.email,
        email: nextUser.email,
        phone: nextUser.phone,
        full_name: nextUser.full_name,
      });
      return true;
    }

    return false;
  }

  async function register(
    params: RegisterParams,
  ): Promise<{ success: boolean; message?: string }> {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.full_name.trim();
    const baseUsername =
      params.username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") ||
      cleanName.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
      cleanEmail.split("@")[0].replace(/[^a-z0-9_]/g, "");
    const username =
      baseUsername.length >= 3
        ? baseUsername
        : `${baseUsername}${Math.floor(100 + Math.random() * 900)}`;

    try {
      const res = await api.post<{
        success: boolean;
        message?: string;
        data?: {
          token?: string;
          access_token?: string;
          akun?: {
            uuid?: string;
            email: string;
            username?: string;
            full_name?: string;
            phone?: string;
            loyalty_points?: number;
          };
        };
      }>("/auth/register", {
        email: cleanEmail,
        username,
        password: params.password,
        full_name: cleanName || undefined,
        phone: params.phone?.trim() || undefined,
      });

      const token = res.data?.data?.token || res.data?.data?.access_token;
      const akun = res.data?.data?.akun;

      if (token && akun) {
        setAuthToken(token);
        const nextUser: AuthUser = {
          id: akun.uuid,
          full_name: akun.full_name || cleanName || akun.username || "Pengguna",
          email: akun.email,
          phone: akun.phone || params.phone?.trim(),
          username: akun.username || username,
          address: params.address?.trim(),
          loyalty_points: akun.loyalty_points ?? 0,
        };
        setUser(nextUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        window.dispatchEvent(new Event("order-history-updated"));

        if (params.address?.trim()) {
          try {
            await createAddressApi(
              {
                label: "Rumah Utama",
                recipientName: nextUser.full_name,
                phone: nextUser.phone || "",
                addressLine: params.address.trim(),
                city: "",
                province: "",
                postalCode: "",
                isDefault: true,
              },
              nextUser.email,
            );
          } catch {
            // Ignore initial address error
          }
        }
      }

      return { success: true };
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const errorMsg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error ||
        "Pendaftaran akun gagal. Silakan coba lagi.";
      return { success: false, message: errorMsg };
    }
  }

  const refreshProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await api.get<{
        success: boolean;
        data?: {
          uuid?: string;
          email?: string;
          username?: string;
          full_name?: string;
          phone?: string;
          address?: string;
          loyalty_points?: number;
        };
      }>("/auth/profile");
      const akun = res.data?.data;
      if (akun) {
        setUser((prev) => {
          const nextUser: AuthUser = {
            id: akun.uuid ?? prev?.id,
            full_name:
              akun.full_name ||
              akun.username ||
              prev?.full_name ||
              DEMO_ACCOUNT.full_name,
            email: akun.email || prev?.email || "",
            phone: akun.phone || prev?.phone || DEMO_ACCOUNT.phone,
            username: akun.username || prev?.username || DEMO_ACCOUNT.username,
            address: akun.address || prev?.address || DEMO_ACCOUNT.address,
            loyalty_points: akun.loyalty_points ?? prev?.loyalty_points ?? 0,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
          return nextUser;
        });
      }
    } catch {
      // ignore
    }
  }, []);

  async function updateProfile(data: {
    full_name?: string;
    phone?: string;
    username?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await api.put<{
        success: boolean;
        message?: string;
        data?: {
          uuid?: string;
          email?: string;
          username?: string;
          full_name?: string;
          phone?: string;
          address?: string;
          loyalty_points?: number;
        };
      }>("/auth/profile", data);

      const akun = res.data?.data;
      if (akun) {
        setUser((prev) => {
          const nextUser: AuthUser = {
            id: akun.uuid ?? prev?.id,
            full_name:
              akun.full_name ||
              akun.username ||
              prev?.full_name ||
              DEMO_ACCOUNT.full_name,
            email: akun.email || prev?.email || "",
            phone: akun.phone || prev?.phone || DEMO_ACCOUNT.phone,
            username: akun.username || prev?.username || DEMO_ACCOUNT.username,
            address: akun.address || prev?.address || DEMO_ACCOUNT.address,
            loyalty_points: akun.loyalty_points ?? prev?.loyalty_points ?? 0,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
          return nextUser;
        });
      }
      return { success: true };
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const errorMsg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error ||
        "Gagal memperbarui profil";
      return { success: false, message: errorMsg };
    }
  }

  useEffect(() => {
    void refreshProfile();

    const onSync = () => void refreshProfile();
    window.addEventListener("focus", onSync);
    window.addEventListener("auth_updated", onSync);

    const unsubOrder = websocketService.on("order_updated", () => {
      void refreshProfile();
    });
    const unsubStatus = websocketService.on("order_status_updated", () => {
      void refreshProfile();
    });

    return () => {
      window.removeEventListener("focus", onSync);
      window.removeEventListener("auth_updated", onSync);
      unsubOrder();
      unsubStatus();
    };
  }, [refreshProfile]);

  function logout() {
    setUser(null);
    removeAuthToken();
    localStorage.removeItem(STORAGE_KEY);
    clearStoredOrders();
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
      register,
      logout,
      addLoyaltyPoints,
      updateProfile,
      refreshProfile,
    }),
    [user, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
