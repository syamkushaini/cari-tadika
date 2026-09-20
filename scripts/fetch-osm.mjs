// Fetches kindergartens/childcare across Malaysia from OpenStreetMap (Overpass API), state by state,
// and writes src/data/generated/places.json in the same shape the Google script uses.
// No account or key needed. Only identity/location/contact is taken; verification lives in curated.json.
//
//   npm run fetch:osm                 # all of Malaysia (16 queries, ~a minute or two)
//   SCOPE=local npm run fetch:osm     # only within RADIUS_M (default 25 km) of the default centre
//
// Data © OpenStreetMap contributors, ODbL. The app shows this credit when OSM data is in use.
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const CENTRE = { lat: 6.19625, lng: 100.40873 }; // Kolej Tentera Udara, Kepala Batas
const RADIUS_M = Number(process.env.RADIUS_M ?? 25000);
const OUT = new URL("../src/data/generated/places.json", import.meta.url);
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

const STATES = {
  "MY-01": "Johor", "MY-02": "Kedah", "MY-03": "Kelantan", "MY-04": "Melaka", "MY-05": "Negeri Sembilan",
  "MY-06": "Pahang", "MY-07": "Pulau Pinang", "MY-08": "Perak", "MY-09": "Perlis", "MY-10": "Selangor",
  "MY-11": "Terengganu", "MY-12": "Sabah", "MY-13": "Sarawak", "MY-14": "Kuala Lumpur", "MY-15": "Labuan", "MY-16": "Putrajaya",
};

const tagsFilter = `["amenity"~"^(kindergarten|childcare)$"]`;
const stateQuery = (iso) => `[out:json][timeout:180];
area["ISO3166-2"="${iso}"]->.a;
nwr${tagsFilter}(area.a);
out center tags;`;
const localQuery = `[out:json][timeout:60];
nwr${tagsFilter}(around:${RADIUS_M},${CENTRE.lat},${CENTRE.lng});
out center tags;`;

async function overpass(query) {
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
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
    await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
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

const jobs = process.env.SCOPE === "local" ? [{ state: "", query: localQuery }]
  : Object.entries(STATES).map(([iso, state]) => ({ state, query: stateQuery(iso) }));

const byId = new Map();
let elementsSeen = 0;
for (const { state, query } of jobs) {
  const data = await overpass(query);
  elementsSeen += data.elements.length;
  for (const el of data.elements) {
    const t = el.tags ?? {};
    const name = t.name ?? t["name:ms"] ?? t["name:en"];
    const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon;
    if (!name || lat == null || lng == null) continue; // unnamed places can't be identified by a parent
    const [hoursOpen, hoursClose] = hours(t.opening_hours);
    byId.set(`osm:${el.type}/${el.id}`, {
      placeId: `osm:${el.type}/${el.id}`, source: "openstreetmap",
      name, area: t["addr:suburb"] ?? t["addr:city"] ?? t["is_in:city"] ?? state, address: address(t),
      lat: +lat.toFixed(6), lng: +lng.toFixed(6), phone: t.phone ?? t["contact:phone"] ?? null, hoursOpen, hoursClose,
      fetchedAt: new Date().toISOString(), amenity: t.amenity,
    });
  }
  console.log(`${state || "local"}: ${data.elements.length} elements (${byId.size} unique named so far)`);
  await new Promise((r) => setTimeout(r, 2000)); // be polite to the public Overpass server
}
const rows = [...byId.values()];
rows.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(OUT, JSON.stringify(rows, null, 2) + "\n");

const skipped = elementsSeen - rows.length;
console.log(`Wrote ${rows.length} places (${skipped} skipped: no name/location).`);
console.log(`By type: ${rows.filter((r) => r.amenity === "kindergarten").length} kindergarten, ${rows.filter((r) => r.amenity === "childcare").length} childcare/taska.`);
const curatedPath = new URL("../src/data/curated.json", import.meta.url);
const curated = existsSync(curatedPath) ? JSON.parse(readFileSync(curatedPath, "utf8")) : {};
console.log(`${rows.filter((r) => !(r.placeId in curated)).length} have no curated entry yet (shown as Unsure).`);
