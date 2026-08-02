const BASE_URL = 'https://nominatim.openstreetmap.org';
/** Nominatim's usage policy requires an identifying User-Agent and max 1 req/s. */
const HEADERS = { 'User-Agent': 'KropiGo-Mobile/0.1 (support@kropigo.com)', 'Accept-Language': 'en' };
const MIN_INTERVAL_MS = 1100;

let lastRequestAt = 0;

const throttle = async () => {
  const wait = MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();
};

export interface PlaceResult {
  displayName: string;
  lat: number;
  lng: number;
  state?: string;
  district?: string;
}

interface NominatimAddress {
  state?: string;
  state_district?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
}

const toDistrict = (address?: NominatimAddress) =>
  address?.state_district ?? address?.county ?? address?.city ?? address?.town ?? address?.village;

/** Free-text place search, restricted to India to match the web app. */
export const searchPlaces = async (query: string, signal?: AbortSignal): Promise<PlaceResult[]> => {
  if (query.trim().length < 3) return [];
  await throttle();

  const url = `${BASE_URL}/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: HEADERS, signal });
  if (!response.ok) throw new Error('Place search failed');

  const rows = (await response.json()) as Array<{ display_name: string; lat: string; lon: string; address?: NominatimAddress }>;
  return rows.map((row) => ({
    displayName: row.display_name,
    lat: Number(row.lat),
    lng: Number(row.lon),
    state: row.address?.state,
    district: toDistrict(row.address),
  }));
};

/** Turns GPS coordinates into an address + state/district for the listing form. */
export const reverseGeocode = async (lat: number, lng: number): Promise<PlaceResult | null> => {
  await throttle();

  const url = `${BASE_URL}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) return null;

  const row = (await response.json()) as { display_name?: string; address?: NominatimAddress };
  if (!row.display_name) return null;

  return {
    displayName: row.display_name,
    lat,
    lng,
    state: row.address?.state,
    district: toDistrict(row.address),
  };
};
