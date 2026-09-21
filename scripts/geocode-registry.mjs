// Places each ePrasekolah registry row on the map (the registry has no coordinates).
// Tries "taman/kampung, town" first, then the postcode area. Results are cached in
// src/data/registry/kota-setar.geo.json with a quality tag: "taman" (neighbourhood-level,
// usually within ~1 km) or "postcode" (area centroid, coarse). Nominatim policy: 1 request/second.
//
//   node scripts/geocode-registry.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { locality } from "./lib/registry-utils.mjs";

const SRC = new URL("../src/data/registry/kota-setar.psv", import.meta.url);
const OUT = new URL("../src/data/registry/kota-setar.geo.json", import.meta.url);
const VIEWBOX = "100.20,6.30,100.50,5.95"; // Kota Setar + Kuala Kedah + Kepala Batas (lon1,lat1,lon2,lat2)
const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

const rows = readFileSync(SRC, "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => {
  const [code, name, address, postcode, town] = l.split("|");
  return { code, name, address, postcode, town };
});

async function ask(q) {
  const u = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=my&limit=1&viewbox=${VIEWBOX}&bounded=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(u, { headers: { "User-Agent": "cari-tadika/0.1 (personal project)" } });
  if (!res.ok) throw new Error(`${res.status} for ${q}`);
  const [hit] = await res.json();
  await new Promise((r) => setTimeout(r, 1100));
  return hit ? { lat: +(+hit.lat).toFixed(5), lng: +(+hit.lon).toFixed(5), matched: hit.display_name.split(",").slice(0, 3).join(",").trim() } : null;
}

let done = 0;
for (const r of rows) {
  if (cache[r.code]) { done++; continue; }
  const loc = locality(r.address);
  let hit = loc ? await ask(`${loc}, ${r.town}, Kedah`) : null;
  let quality = "taman";
  if (!hit) { hit = await ask(`${r.postcode} ${r.town}, Kedah`); quality = "postcode"; }
  if (!hit) { hit = await ask(`${r.town}, Kedah`); quality = "town"; }
  cache[r.code] = hit ? { ...hit, quality, query: loc ?? r.postcode } : { lat: null, lng: null, quality: "none", query: loc ?? r.postcode };
  writeFileSync(OUT, JSON.stringify(cache, null, 1) + "\n");
  if (++done % 10 === 0) console.log(`${done}/${rows.length}`);
}
const q = Object.values(cache).reduce((a, v) => ((a[v.quality] = (a[v.quality] ?? 0) + 1), a), {});
console.log("done", q);
