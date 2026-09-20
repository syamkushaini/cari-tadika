// Turns typed text ("Bukit Mertajam", "KTU Kepala Batas") into coordinates using OpenStreetMap's
// Nominatim, limited to Malaysia. Shared by web and iPhone. Nominatim's usage policy: at most one
// request per second and no search-as-you-type, so callers must search on submit only.
export type Place = { label: string; lat: number; lng: number };

type NominatimHit = { lat: string; lon: string; name?: string; display_name: string };

/** "Kolej Tentera Udara Alor Setar, Kampung Titi Gajah, Kota Setar, Kedah, Malaysia" → first 3 parts. */
export const shortLabel = (h: NominatimHit) => {
  const parts = h.display_name.split(",").map((s) => s.trim()).filter((p) => p && p !== "Malaysia");
  return parts.slice(0, 3).join(", ");
};

export async function geocode(query: string, fetchFn: typeof fetch = fetch): Promise<Place[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=my&limit=5&accept-language=ms,en&q=${encodeURIComponent(q)}`;
  const res = await fetchFn(url, { headers: { "Accept-Language": "ms,en" } });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const hits = (await res.json()) as NominatimHit[];
  const seen = new Set<string>();
  return hits
    .map((h) => ({ label: shortLabel(h), lat: Number(h.lat), lng: Number(h.lon) }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !seen.has(p.label) && !!seen.add(p.label));
}
