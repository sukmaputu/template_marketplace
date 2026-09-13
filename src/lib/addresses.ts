import type { ShippingAddress } from "@/components/profile/types";

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

const STORAGE_PREFIX = "marketplace-addresses";

function getStorageKey(email?: string) {
  return `${STORAGE_PREFIX}:${email?.trim().toLowerCase() || "guest"}`;
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
) {
  return addresses.map((address) => ({
    ...address,
    isDefault: address.id === addressId,
  }));
}
