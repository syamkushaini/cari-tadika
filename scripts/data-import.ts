// Reads data/kindergartens.xlsx and updates src/data/curated.json + src/data/manual-places.json.
//   npm run data:import                 import data/kindergartens.xlsx
//   npm run data:import -- --dry-run    only check for mistakes, write nothing
//   npm run data:import -- path/to.xlsx use a different file
// If ANY cell is invalid, nothing is written and every problem is listed with its row number.
import ExcelJS from "exceljs";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { REAL_KINDERGARTENS } from "../src/data/real";
import type { Curated, PlaceRow } from "../src/data/real";
import { EDIT_COLUMNS, manualId, parseRow, type EditKey, type RawRow } from "../src/data/sheet";
import { DEFAULT_FILE, MAIN_SHEET, NEW_SHEET, NEW_COLUMNS, cellText, headerMap } from "./sheet-io";

const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
const file = args.find((a) => !a.startsWith("--")) ?? DEFAULT_FILE;
const CURATED = resolve(process.cwd(), "src/data/curated.json");
const MANUAL = resolve(process.cwd(), "src/data/manual-places.json");

/** Keys of a curated entry that the spreadsheet cannot express; they survive an import untouched. */
const KEEP_FROM_OLD = ["name", "area", "source"] as const;
const KEEP_STATUSES = ["reg", "ratio"];

function readRows(ws: ExcelJS.Worksheet, ident: readonly string[]) {
  const h = headerMap(ws);
  const rows: { n: number; ident: Record<string, string>; raw: RawRow }[] = [];
  const missing = [...ident, ...EDIT_COLUMNS.filter((c) => ident !== NEW_COLUMNS || c !== "hide")].filter((c) => !h.has(c) && (ident !== NEW_COLUMNS || c !== "hide"));
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const get = (k: string) => (h.has(k) ? cellText(row.getCell(h.get(k)!), k) : "");
    const identVals = Object.fromEntries(ident.map((k) => [k, get(k)]));
    const raw: RawRow = {};
    for (const k of EDIT_COLUMNS) { const v = get(k); if (v !== "") raw[k as EditKey] = v; }
    rows.push({ n, ident: identVals, raw });
  });
  return { rows, missing };
}

async function geocode(q: string): Promise<{ lat: number; lng: number } | null> {
  const u = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=my&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(u, { headers: { "User-Agent": "cari-tadika/0.1 (personal project)" } });
  if (!res.ok) return null;
  const [hit] = (await res.json()) as { lat: string; lon: string }[];
  await new Promise((r) => setTimeout(r, 1100));
  return hit ? { lat: +hit.lat, lng: +hit.lon } : null;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.readFile(resolve(process.cwd(), file)); } catch { console.error(`Cannot open ${file}. Run "npm run data:export" first, or pass the file path.`); process.exit(1); }

  const errors: string[] = [];
  const warnings: string[] = [];
  const curated: Record<string, Curated> = JSON.parse(readFileSync(CURATED, "utf8"));
  const before = JSON.stringify(curated);
  const known = new Set(REAL_KINDERGARTENS.map((k) => k.id));

  // ---- main sheet: one row per existing listing -----------------------------------------------------
  const main = wb.getWorksheet(MAIN_SHEET);
  if (!main) { console.error(`Sheet "${MAIN_SHEET}" is missing.`); process.exit(1); }
  const m = readRows(main, ["id", "name"]);
  if (m.missing.length) { console.error(`Sheet "${MAIN_SHEET}" is missing columns: ${m.missing.join(", ")}. Do not rename or delete headers.`); process.exit(1); }
  const seen = new Set<string>();
  let updated = 0, cleared = 0;
  for (const r of m.rows) {
    const id = r.ident.id;
    if (!id) continue;
    if (!known.has(id) && !id.startsWith("manual:")) { warnings.push(`Row ${r.n}: id "${id}" is not a known listing; skipped.`); continue; }
    if (seen.has(id)) { errors.push(`Row ${r.n} (${r.ident.name}): duplicate id ${id}.`); continue; }
    seen.add(id);
    const { curated: next, errors: es } = parseRow(r.raw);
    es.forEach((e) => errors.push(`Row ${r.n} (${r.ident.name}): ${e}`));
    if (es.length) continue;
    applyEntry(curated, id, next) ? updated++ : 0;
    if (!next && before.includes(`"${id}"`)) cleared++;
  }

  // ---- add-new sheet: kindergartens missing from the sources ---------------------------------------
  const manual: PlaceRow[] = [];
  const nw = wb.getWorksheet(NEW_SHEET);
  const oldManual = JSON.parse(readFileSync(MANUAL, "utf8")) as PlaceRow[];
  if (nw) {
    const nr = readRows(nw, NEW_COLUMNS);
    const ids = new Set<string>();
    for (const r of nr.rows) {
      const { name, area, address, lat, lng } = r.ident;
      const empty = !name && !address && !lat && !lng && Object.keys(r.raw).length === 0;
      if (empty) continue;
      if (!name) { errors.push(`Add new, row ${r.n}: name is required.`); continue; }
      const id = manualId(name, address);
      if (ids.has(id)) { errors.push(`Add new, row ${r.n} (${name}): duplicates another row (same name and address).`); continue; }
      ids.add(id);
      const { curated: next, errors: es } = parseRow(r.raw);
      es.forEach((e) => errors.push(`Add new, row ${r.n} (${name}): ${e}`));
      let pos = lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
      if (pos && (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lng) || pos.lat < 0.8 || pos.lat > 7.5 || pos.lng < 99 || pos.lng > 119.5)) {
        errors.push(`Add new, row ${r.n} (${name}): lat/lng "${lat}, ${lng}" is not inside Malaysia.`); continue;
      }
      if (!pos) {
        const prev = oldManual.find((p) => p.placeId === id);
        if (prev) pos = { lat: prev.lat, lng: prev.lng };
        else if (dry) warnings.push(`Add new, row ${r.n} (${name}): no lat/lng; would be looked up from the address.`);
        else {
          pos = await geocode(`${address || name}${area ? ", " + area : ""}, Malaysia`);
          if (!pos) { errors.push(`Add new, row ${r.n} (${name}): could not find a location. Enter lat and lng (right-click a spot in Google Maps to copy them).`); continue; }
          warnings.push(`Add new, row ${r.n} (${name}): position looked up from the address (approximate).`);
        }
      }
      if (es.length || !pos) continue;
      const prev = oldManual.find((p) => p.placeId === id);
      manual.push({
        placeId: id, source: "manual", name, area, address: address || null, lat: pos.lat, lng: pos.lng, phone: null, hoursOpen: null, hoursClose: null,
        fetchedAt: prev?.fetchedAt ?? new Date().toISOString(), locationApprox: !(lat && lng),
      });
      applyEntry(curated, id, next);
    }
    // Rows removed from "Add new" drop their curated entry too.
    for (const p of oldManual) if (!ids.has(p.placeId) && !errors.length) delete curated[p.placeId];
  } else manual.push(...oldManual);

  // ---- report -------------------------------------------------------------------------------------
  warnings.forEach((w) => console.log("note:", w));
  if (errors.length) {
    console.error(`\n${errors.length} problem${errors.length > 1 ? "s" : ""} found. Nothing was saved:\n`);
    errors.forEach((e) => console.error("  x " + e));
    console.error("\nFix these cells in the spreadsheet and run the import again.");
    process.exit(1);
  }
  const after = JSON.stringify(curated);
  const entries = Object.keys(curated).length;
  console.log(`${dry ? "Checked (dry run)" : "Read"} ${file}: ${entries} listings have your data, ${manual.length} added by hand.`);
  console.log(after === before ? "No changes to curated data." : `Changed: ${updated} updated, ${cleared} cleared.`);
  if (dry) return;
  const sorted = Object.fromEntries(Object.entries(curated).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(CURATED, JSON.stringify(sorted, null, 2) + "\n");
  writeFileSync(MANUAL, JSON.stringify(manual, null, 2) + "\n");
  console.log("Saved. Next: npm run data:publish   (or: npm run build to preview).");
}

/** Replace the sheet-managed part of an entry, keeping fields the sheet cannot express. Returns true if changed. */
function applyEntry(curated: Record<string, Curated>, id: string, next: Curated | null): boolean {
  const old = curated[id];
  let merged: Curated | null = next;
  if (old) {
    const keep: Record<string, unknown> = {};
    for (const k of KEEP_FROM_OLD) if (old[k] !== undefined) keep[k] = old[k];
    const keptStatuses = Object.fromEntries(Object.entries(old.statuses ?? {}).filter(([k]) => KEEP_STATUSES.includes(k)));
    if (Object.keys(keptStatuses).length) keep.statuses = { ...keptStatuses, ...(next?.statuses ?? {}) };
    if (Object.keys(keep).length || next) merged = { ...(next ?? {}), ...keep, ...(keep.statuses ? { statuses: keep.statuses as Curated["statuses"] } : {}) } as Curated;
  }
  const changed = JSON.stringify(old ?? null) !== JSON.stringify(merged ?? null);
  if (merged && Object.keys(merged).length) curated[id] = merged; else delete curated[id];
  return changed;
}

main().catch((e) => { console.error(e); process.exit(1); });
