// Converts the ePrasekolah export (+ geocoded positions) into src/data/generated/registry.json.
//   node scripts/build-registry.mjs   (run after geocode-registry.mjs)
import { readFileSync, writeFileSync } from "node:fs";
import { locality, titleCase } from "./lib/registry-utils.mjs";

const psv = readFileSync(new URL("../src/data/registry/kota-setar.psv", import.meta.url), "utf8");
const geo = JSON.parse(readFileSync(new URL("../src/data/registry/kota-setar.geo.json", import.meta.url), "utf8"));
const fetchedAt = "2026-09-21T00:00:00.000Z"; // date the user exported the registry list

const out = [];
const skipped = [];
for (const line of psv.split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const [code, name, address, postcode, town, phone, vac] = line.split("|");
  // K5A0000 "TADIKA XYZ, 123 JLN IPOH, 31400" is a placeholder/test record in the registry.
  if (/0000$/.test(code)) { skipped.push(`${code} ${name}`); continue; }
  const g = geo[code];
  if (!g || g.lat == null) { skipped.push(`${code} ${name} (no position)`); continue; }
  const loc = locality(address);
  out.push({
    placeId: `kpm:${code}`, institutionCode: code, source: "official_registry", kpmRegistered: true,
    name: titleCase(name), area: loc ? titleCase(loc) : titleCase(town), address: `${address}, ${postcode} ${titleCase(town)}, Kedah`,
    lat: g.lat, lng: g.lng, locationApprox: g.quality !== "taman",
    phone: phone.replace(/\s+/g, "") || null, hoursOpen: null, hoursClose: null,
    vacancies: vac === "-" ? null : Number(vac), fetchedAt,
  });
}
out.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(new URL("../src/data/generated/registry.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log(`Wrote ${out.length} registry listings. Skipped: ${skipped.join("; ") || "none"}`);
console.log("approximate positions:", out.filter((r) => r.locationApprox).length);
