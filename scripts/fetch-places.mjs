// Fetches kindergarten listings around Alor Setar from Google Places API (New)
// and writes src/data/generated/places.json. Facts are NOT inferred: this only gets
// identity, location, phone and opening hours. Verification lives in src/data/curated.json.
//
//   GOOGLE_PLACES_API_KEY=... npm run fetch:places
//
// Cost/terms: phone + opening hours are "Enterprise"-tier fields (billed higher than basic).
// Google's terms limit how long place content may be cached (place IDs are exempt), so
// re-run this regularly rather than treating the output as permanent.
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!KEY) { console.error("Set GOOGLE_PLACES_API_KEY first."); process.exit(1); }

const CENTRE = { latitude: 6.121, longitude: 100.368 }; // Alor Setar town centre
const RADIUS_M = Number(process.env.RADIUS_M ?? 20000); // Places caps location bias radius at 50 km
const QUERIES = ["tadika", "taska", "prasekolah", "kindergarten", "tadika swasta", "tadika islam"];
const OUT = new URL("../src/data/generated/places.json", import.meta.url);
const FIELDS = [
  "places.id", "places.displayName", "places.formattedAddress", "places.location",
  "places.nationalPhoneNumber", "places.regularOpeningHours", "places.addressComponents",
  "places.businessStatus", "nextPageToken",
].join(",");

async function search(textQuery, pageToken) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": FIELDS },
    body: JSON.stringify({
      textQuery: `${textQuery} Alor Setar`, languageCode: "ms", regionCode: "MY", pageSize: 20,
      locationBias: { circle: { center: CENTRE, radius: RADIUS_M } },
      ...(pageToken ? { pageToken } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Places ${res.status}: ${await res.text()}`);
  return res.json();
}

const pad = (n) => String(n).padStart(2, "0");
/** Typical weekday hours (Monday), "HH:MM"; null if Google has none. */
function weekdayHours(h) {
  const p = h?.periods?.find((x) => x.open?.day === 1 && x.close);
  return p ? [`${pad(p.open.hour)}:${pad(p.open.minute ?? 0)}`, `${pad(p.close.hour)}:${pad(p.close.minute ?? 0)}`] : [null, null];
}
function areaOf(place) {
  const c = place.addressComponents ?? [];
  const pick = (t) => c.find((x) => x.types?.includes(t))?.longText;
  return pick("sublocality_level_1") ?? pick("sublocality") ?? pick("neighborhood") ?? pick("locality") ?? "";
}

const found = new Map();
for (const q of QUERIES) {
  let token;
  do {
    const data = await search(q, token);
    for (const p of data.places ?? []) if (p.businessStatus !== "CLOSED_PERMANENTLY") found.set(p.id, p);
    token = data.nextPageToken;
  } while (token);
  console.log(`"${q}": ${found.size} unique so far`);
}

const now = new Date().toISOString();
const rows = [...found.values()].map((p) => {
  const [hoursOpen, hoursClose] = weekdayHours(p.regularOpeningHours);
  return {
    placeId: p.id, name: p.displayName?.text ?? "", area: areaOf(p), address: p.formattedAddress ?? null,
    lat: p.location.latitude, lng: p.location.longitude, phone: p.nationalPhoneNumber ?? null,
    hoursOpen, hoursClose, fetchedAt: now,
  };
}).sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(OUT, JSON.stringify(rows, null, 2) + "\n");
console.log(`Wrote ${rows.length} places.`);

// Help curation: list places that have no curated entry yet.
const curatedPath = new URL("../src/data/curated.json", import.meta.url);
const curated = existsSync(curatedPath) ? JSON.parse(readFileSync(curatedPath, "utf8")) : {};
const todo = rows.filter((r) => !(r.placeId in curated));
console.log(`${todo.length} places have no curated entry (shown as Unsure everywhere). Review names for non-kindergartens and add {"exclude": true}.`);
