export interface PostalCodeLookup {
  city: string;
  province: string;
}

export async function lookupPostalCode(
  postalCode: string,
): Promise<PostalCodeLookup | null> {
  if (!/^\d{5}$/.test(postalCode)) return null;

  const response = await fetch(
    `https://kodepos.vercel.app/search/?q=${postalCode}`,
  );
  if (!response.ok) return null;

  const result = (await response.json()) as {
    data?: Array<{
      regency?: string;
      city?: string;
      kabupaten?: string;
      province?: string;
      provinsi?: string;
    }>;
  };
  const location = result.data?.[0];
  if (!location) return null;

  return {
    city: location.regency ?? location.city ?? location.kabupaten ?? "",
    province: location.province ?? location.provinsi ?? "",
  };
}
