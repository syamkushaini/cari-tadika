# Cari Tadika

Find a nearby kindergarten (tadika) in Malaysia, score it against a 9-point red-flag checklist, see the estimated yearly cost, and compare up to 3 side by side. Bilingual (Bahasa Malaysia / English), phone-first.

Next.js (App Router) · TypeScript · Tailwind v4 · Vitest. No backend in v1: data is seeded, parent edits are stored per device.

```bash
npm run dev      # http://localhost:3000
npm test         # logic tests (cost, scoring, filters, compare, i18n parity)
npm run lint && npm run build
```

## Layout

| Path | What |
|---|---|
| `src/content/criteria.ts` | The 9 criteria (ms/en), ported verbatim from the prototype |
| `src/content/i18n.ts` | All UI copy (ms/en), verbatim. Extra keys added only for strings the prototype had inlined (cost line labels, "CRITICAL" tag, aria labels) |
| `src/lib/types.ts` | `Kindergarten`, `Override`, status enums (spec §4) |
| `src/lib/{cost,scoring,filter,compare,geo,format}.ts` | Pure logic, no React. Covered by `logic.test.ts` |
| `src/lib/overrides.ts`, `localStore.ts` | Per-device overrides + notes (localStorage via `useSyncExternalStore`) |
| `src/data/seed.ts` | The prototype's 9 sample kindergartens, all `source: "sample"` |
| `src/data/repository.ts` | The one place data is read. Swap for a DB/API later |
| `src/components/` | Finder (state), card, detail dialog, compare dialog |
| `src/app/globals.css` | Design tokens (light/dark) and component styles |

## Behaviour notes

- **Score** = number of `ok` statuses out of 9. A `flag` on a critical criterion (`reg`, `safe`) marks the listing *major*: red ribbon, "SEMAK/CHECK" stamp, and hidden by default.
- **Ratio status is derived** from `teacherStudentRatio` (≤ 15 → ok) rather than stored, as in the prototype.
- **Annual cost** = registration + monthly fee × `billableMonths` + books + uniform + activities + (optional) transport × `billableMonths`. `billableMonths` defaults to 12 (spec §5.4); nothing in the UI edits it yet.
- Parent overrides live in `localStorage` (`cariTadika.v2`). The prototype's `cariTadika.v1` data is **not** migrated (its shape used array indices, and the prototype was a demo).

## Real data (all of Malaysia)

Listings come from two files (1,151 OpenStreetMap places as of the last fetch; OSM coverage is partial, see below), merged in `src/data/real.ts`. Default search origin is `DEFAULT_CENTRE` in `src/data/seed.ts` (also set in both fetch scripts). If `places.json` is empty the app falls back to the fictional samples.

0. **Free option, no key:** `npm run fetch:osm` pulls every named kindergarten/childcare place in Malaysia from OpenStreetMap, state by state (`SCOPE=local` limits it to 25 km around the default centre).
1. **Or fetch from Google Places** (name, location, phone, hours) from Google Places:
   `GOOGLE_PLACES_API_KEY=... npm run fetch:places` writes `src/data/generated/places.json`.
   Needs a Google Cloud key with the *Places API (New)* enabled and billing on. Phone and opening hours are higher-priced fields.
2. **Add what you verified** in `src/data/curated.json`, keyed by place id:
   ```json
   {
     "ChIJ...": { "kpmRegistered": true, "monthlyFee": 350, "teacherStudentRatio": 12,
                  "registrationFee": 200, "statuses": { "safe": "ok" } },
     "ChIJ...": { "exclude": true }
   }
   ```
   `kpmRegistered` is set only after checking KPM ePrasekolah; that sets `source: "official_registry"`.

**Trust rule:** every criterion starts as Unsure. Only `curated.json` can turn one to OK. Unknown fees show "Not yet known", never a guess; an unknown cost is never highlighted as cheapest and is not hidden by the budget filter.

**Terms:** Google restricts how long Places content may be stored (place IDs excepted). Treat `places.json` as a cache: re-run the fetch regularly, and check Google's current terms before publishing publicly.

### KPM registry (Kota Setar)

`src/data/registry/kota-setar.psv` is the ePrasekolah "Carian Institusi" list for Kota Setar (180 rows; 179 imported, the placeholder record K5A0000 "Tadika XYZ" is skipped). It was copied by hand from a logged-in parent account, not scraped. Registry rows are marked `kpmRegistered: true` and `source: "official_registry"`; every other criterion stays Unsure.

- `node scripts/geocode-registry.mjs` places rows on the map (Nominatim, cached in `kota-setar.geo.json`). 93 are neighbourhood-level; 86 are only postcode-area level and show a "≈" before the distance.
- `node scripts/build-registry.mjs` writes `src/data/generated/registry.json`.
- `mergeSources` in `real.ts` merges a registry row with an OpenStreetMap place of the same normalised name within 3 km, keeping the registry identity and OSM's more precise position.
- To add another district, paste its rows into a new `.psv` in the same 7-column format and repeat the two scripts.

## Open decisions (spec §5), unchanged

Auth model for overrides · how parents' verifications become trusted (`parent_verified`) · crowdsourcing fees and ratios (`sample` → `parent_verified` / `official_registry`). Until decided, everything is sample data and clearly labelled as such.
