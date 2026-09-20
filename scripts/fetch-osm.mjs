// Fetches kindergartens/childcare around Alor Setar from OpenStreetMap (Overpass API)
// and writes src/data/generated/places.json in the same shape the Google script uses.
// No account or key needed. Only identity/location/contact is taken; verification lives in curated.json.
//
//   npm run fetch:osm
//
// Data © OpenStreetMap contributors, ODbL. The app shows this credit when OSM data is in use.
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const CENTRE = { lat: 6.121, lng: 100.368 };
const RADIUS_M = Number(process.env.RADIUS_M ?? 25000);
const OUT = new URL("../src/data/generated/places.json", import.meta.url);
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

const query = `[out:json][timeout:60];
(
  nwr["amenity"="kindergarten"](around:${RADIUS_M},${CENTRE.lat},${CENTRE.lng});
  nwr["amenity"="childcare"](around:${RADIUS_M},${CENTRE.lat},${CENTRE.lng});
);
out center tags;`;

async function overpass() {
  let last;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "cari-tadika/0.1 (personal project)" },
        body: "data=" + encodeURIComponent(query),
      });
      if (res.ok) return res.json();
      last = new Error(`${url} -> ${res.status}`);
    } catch (e) { last = e; }
  }
  throw last;
}

const pad = (n) => String(n).padStart(2, "0");
/** Best effort: first "HH:MM-HH:MM" in opening_hours (e.g. "Mo-Fr 07:30-18:00"). */
function hours(oh) {
  const m = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/.exec(oh ?? "");
  return m ? [`${pad(+m[1])}:${m[2]}`, `${pad(+m[3])}:${m[4]}`] : [null, null];
}
const address = (t) => {
  const line = [t["addr:housenumber"], t["addr:street"], t["addr:suburb"], t["addr:postcode"], t["addr:city"]].filter(Boolean).join(", ");
  return t["addr:full"] ?? (line || null);
};

const data = await overpass();
const rows = [];
for (const el of data.elements) {
  const t = el.tags ?? {};
  const name = t.name ?? t["name:ms"] ?? t["name:en"];
  const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
  if (!name || lat == null || lng == null) continue; // unnamed places can't be identified by a parent
  const [hoursOpen, hoursClose] = hours(t.opening_hours);
  rows.push({
    placeId: `osm:${el.type}/${el.id}`, source: "openstreetmap",
    name, area: t["addr:suburb"] ?? t["addr:city"] ?? t["is_in:city"] ?? "", address: address(t),
    lat, lng, phone: t.phone ?? t["contact:phone"] ?? null, hoursOpen, hoursClose, fetchedAt: new Date().toISOString(),
    amenity: t.amenity,
  });
}
rows.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(OUT, JSON.stringify(rows, null, 2) + "\n");

const skipped = data.elements.length - rows.length;
console.log(`Wrote ${rows.length} places (${skipped} skipped: no name/location).`);
console.log(`By type: ${rows.filter((r) => r.amenity === "kindergarten").length} kindergarten, ${rows.filter((r) => r.amenity === "childcare").length} childcare/taska.`);
const curatedPath = new URL("../src/data/curated.json", import.meta.url);
const curated = existsSync(curatedPath) ? JSON.parse(readFileSync(curatedPath, "utf8")) : {};
console.log(`${rows.filter((r) => !(r.placeId in curated)).length} have no curated entry yet (shown as Unsure).`);
