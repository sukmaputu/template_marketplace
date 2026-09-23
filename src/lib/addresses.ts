import type { ShippingAddress } from "@/components/profile/types";
import { api, getAuthToken } from "@/lib/api";
import { websocketService } from "@/lib/websocket";

export interface SavedAddress extends ShippingAddress {
  id: string;
  label: string;
  isDefault: boolean;
}

export interface AddressOwner {
  full_name?: string;
  phone?: string;
  address?: string;
}

export interface BackendAddress {
  uuid?: string;
  id?: string;
  account_uuid?: string;
  user_id?: string;
  label?: string | null;
  recipient_name: string;
  recipient_phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddressInput {
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault?: boolean;
}

const STORAGE_PREFIX = "marketplace-addresses";

function getStorageKey(email?: string) {
  return `${STORAGE_PREFIX}:${email?.trim().toLowerCase() || "guest"}`;
}

export function mapBackendToSavedAddress(ba: BackendAddress): SavedAddress {
  return {
    id: ba.uuid || ba.id || createAddressId(),
    label: ba.label || "Alamat",
    recipientName: ba.recipient_name,
    phone: ba.recipient_phone,
    addressLine: ba.address_line_1,
    city: ba.city || "",
    province: ba.province || "",
    postalCode: ba.postal_code || "",
    isDefault: Boolean(ba.is_primary),
  };
}

export function mapSavedToBackendRequest(sa: AddressInput | SavedAddress) {
  return {
    label: sa.label,
    recipient_name: sa.recipientName,
    recipient_phone: sa.phone,
    address_line_1: sa.addressLine,
    address_line_2: "",
    district: "",
    city: sa.city,
    province: sa.province,
    postal_code: sa.postalCode,
    country_code: "ID",
    is_primary: Boolean(sa.isDefault),
  };
}

export function getSavedAddresses(
  email?: string,
  owner?: AddressOwner,
): SavedAddress[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(getStorageKey(email));
    if (!saved) return createLegacyAddress(owner);

    const parsed = JSON.parse(saved) as SavedAddress[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : createLegacyAddress(owner);
  } catch {
    return createLegacyAddress(owner);
  }
}

function createLegacyAddress(owner?: AddressOwner): SavedAddress[] {
  if (!owner?.address?.trim()) return [];

  return [
    {
      id: `legacy-address-${emailKey(owner.address)}`,
      label: "Alamat utama",
      recipientName: owner.full_name?.trim() || "Penerima",
      phone: owner.phone?.trim() || "",
      addressLine: owner.address.trim(),
      city: "",
      province: "",
      postalCode: "",
      isDefault: true,
    },
  ];
}

function emailKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 32);
}

export function saveSavedAddresses(addresses: SavedAddress[], email?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(email), JSON.stringify(addresses));
}

export function createAddressId() {
  return `address-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function setDefaultAddress(
  addresses: SavedAddress[],
  addressId: string,
): SavedAddress[] {
  return addresses.map((address) => ({
    ...address,
    isDefault: address.id === addressId,
  }));
}

function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export async function fetchAddressesFromBackend(
  email?: string,
  owner?: AddressOwner,
): Promise<SavedAddress[]> {
  const token = getAuthToken();
  if (!token) {
    return getSavedAddresses(email, owner);
  }

  try {
    const res = await api.get<{
      success: boolean;
      data: BackendAddress[];
    }>("/core/addresses");

    if (Array.isArray(res.data?.data)) {
      const mapped = res.data.data.map(mapBackendToSavedAddress);
      saveSavedAddresses(mapped, email);
      return mapped;
    }
  } catch (err) {
    console.warn("Falling back to local addresses due to API error:", err);
  }

  return getSavedAddresses(email, owner);
}

export async function createAddressApi(
  input: AddressInput,
  email?: string,
): Promise<SavedAddress> {
  const token = getAuthToken();

  if (token) {
    try {
      const res = await api.post<{
        success: boolean;
        data: BackendAddress;
      }>("/core/addresses", mapSavedToBackendRequest(input));

      if (res.data?.data) {
        const record = mapBackendToSavedAddress(res.data.data);
        const existing = getSavedAddresses(email);
        const next = input.isDefault
          ? [
              ...existing.map((a) => ({ ...a, isDefault: false })),
              record,
            ]
          : [...existing, record];
        saveSavedAddresses(next, email);
        websocketService.broadcastLocal({ type: "address_updated" });
        return record;
      }
    } catch (err) {
      console.warn("Backend address creation failed, saving locally:", err);
    }
  }

  const existing = getSavedAddresses(email);
  const record: SavedAddress = {
    ...input,
    id: createAddressId(),
    isDefault: input.isDefault ?? existing.length === 0,
  };
  const next = record.isDefault
    ? [...existing.map((a) => ({ ...a, isDefault: false })), record]
    : [...existing, record];
  saveSavedAddresses(next, email);
  websocketService.broadcastLocal({ type: "address_updated" });
  return record;
}

export async function updateAddressApi(
  id: string,
  input: AddressInput,
  email?: string,
): Promise<SavedAddress> {
  const token = getAuthToken();

  if (token && isUUID(id)) {
    try {
      const res = await api.put<{
        success: boolean;
        data: BackendAddress;
      }>(`/core/addresses/${id}`, mapSavedToBackendRequest(input));

      if (res.data?.data) {
        const record = mapBackendToSavedAddress(res.data.data);
        const existing = getSavedAddresses(email);
        const next = existing.map((a) => (a.id === id ? record : a));
        saveSavedAddresses(next, email);
        websocketService.broadcastLocal({ type: "address_updated" });
        return record;
      }
    } catch (err) {
      console.warn("Backend address update failed, saving locally:", err);
    }
  }

  const existing = getSavedAddresses(email);
  const updated: SavedAddress = {
    ...input,
    id,
    isDefault:
      input.isDefault ??
      existing.find((a) => a.id === id)?.isDefault ??
      false,
  };
  const next = existing.map((a) => (a.id === id ? updated : a));
  saveSavedAddresses(next, email);
  websocketService.broadcastLocal({ type: "address_updated" });
  return updated;
}

export async function deleteAddressApi(
  id: string,
  email?: string,
): Promise<void> {
  const token = getAuthToken();

  if (token && isUUID(id)) {
    try {
      await api.delete(`/core/addresses/${id}`);
    } catch (err) {
      console.warn("Backend address delete failed:", err);
    }
  }

  const remaining = getSavedAddresses(email).filter((a) => a.id !== id);
  saveSavedAddresses(remaining, email);
  websocketService.broadcastLocal({ type: "address_updated" });
}

export async function setDefaultAddressApi(
  id: string,
  email?: string,
): Promise<void> {
  const token = getAuthToken();

  if (token && isUUID(id)) {
    try {
      await api.patch(`/core/addresses/${id}/primary`);
    } catch (err) {
      console.warn("Backend set default address failed:", err);
    }
  }

  const next = setDefaultAddress(getSavedAddresses(email), id);
  saveSavedAddresses(next, email);
  websocketService.broadcastLocal({ type: "address_updated" });
}
