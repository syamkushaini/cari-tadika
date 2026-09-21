// Builds real listings from two sources:
//   generated/places.json  – fetched by `npm run fetch:places` (name, location, phone, hours). Unverified.
//   curated.json           – facts YOU verified, keyed by Google place id. The ONLY way a criterion becomes "ok".
// Trust rule: every criterion starts "unsure". Nothing is passed by default.
import { CRITERIA } from "@/content/criteria";
import type { CurriculumCode, DataSource, Kindergarten, KgModifier, KgType, Status } from "@/lib/types";
import { ratioStatus } from "./ratio";
import placesJson from "./generated/places.json";
import curatedJson from "./curated.json";
import registryJson from "./generated/registry.json";
import { km } from "@/lib/geo";

export type PlaceRow = {
  placeId: string; name: string; area: string; address: string | null; lat: number; lng: number;
  phone: string | null; hoursOpen: string | null; hoursClose: string | null; fetchedAt: string;
  /** Where the listing came from; defaults to google_places. */
  source?: DataSource;
  /** Set by the registry import: listed on ePrasekolah, so KPM-registered. */
  kpmRegistered?: boolean;
  institutionCode?: string;
  vacancies?: number | null;
  locationApprox?: boolean;
};

/** Government agencies that run kindergartens. Only unambiguous names; everything else defaults to private. */
export const looksGovernment = (name: string) => /\b(kemas|perpaduan)\b|prasekolah\s+(sekolah|sk\b)/i.test(name);

export type Curated = Partial<{
  /** true/false only when checked against the KPM ePrasekolah registry. */
  kpmRegistered: boolean | null;
  type: KgType; modifier: KgModifier; curriculumCode: CurriculumCode;
  monthlyFee: number; teacherStudentRatio: number; registrationFee: number;
  annualBooksCost: number; annualUniformCost: number; annualActivitiesCost: number;
  monthlyTransportCost: number; billableMonths: number;
  /** Per-criterion statuses you verified in person, e.g. { safe: "ok" }. */
  statuses: Record<string, Status>;
  source: DataSource;
  /** Drop this place (not a kindergarten, closed, duplicate…). */
  exclude: boolean;
  name: string; area: string;
}>;

export function buildReal(places: PlaceRow[], curated: Record<string, Curated>): Kindergarten[] {
  return places.flatMap((p) => {
    const c = curated[p.placeId] ?? {};
    if (c.exclude) return [];
    const statuses: Record<string, Status> = Object.fromEntries(CRITERIA.map((cr) => [cr.k, "unsure" as Status]));
    const kpm = c.kpmRegistered !== undefined ? c.kpmRegistered : p.kpmRegistered ?? null;
    if (kpm != null) statuses.reg = kpm ? "ok" : "flag";
    if (c.teacherStudentRatio != null) statuses.ratio = ratioStatus(c.teacherStudentRatio);
    Object.assign(statuses, c.statuses);
    const source: DataSource = c.source ?? (kpm != null ? "official_registry" : p.source ?? "google_places");
    return [{
      id: p.placeId, placeId: p.placeId, name: c.name ?? p.name, area: c.area ?? p.area,
      address: p.address, phone: p.phone, fetchedAt: p.fetchedAt, lat: p.lat, lng: p.lng,
      type: c.type ?? (looksGovernment(c.name ?? p.name) ? "government" : "private"), modifier: c.modifier ?? "none",
      monthlyFee: c.monthlyFee ?? null, teacherStudentRatio: c.teacherStudentRatio ?? null,
      curriculumCode: c.curriculumCode ?? "none_stated",
      hoursOpen: p.hoursOpen, hoursClose: p.hoursClose,
      kpmRegistered: kpm,
      institutionCode: p.institutionCode ?? null, vacancies: p.vacancies ?? null, locationApprox: p.locationApprox ?? false,
      registrationFee: c.registrationFee ?? null, annualBooksCost: c.annualBooksCost ?? null,
      annualUniformCost: c.annualUniformCost ?? null, annualActivitiesCost: c.annualActivitiesCost ?? null,
      monthlyTransportCost: c.monthlyTransportCost ?? null,
      billableMonths: c.billableMonths ?? 12,
      source, statuses,
    }];
  });
}

/** Comparable name: drops "tadika/taska/tabika", punctuation and spacing. */
export const normName = (s: string) => s.toLowerCase().replace(/\b(tadika|taska|tabika|prasekolah)\b/g, "").replace(/[^a-z0-9]/g, "");

/**
 * Registry rows are authoritative for identity and KPM status. When an OpenStreetMap place has the same
 * normalised name within 3 km, the two are the same kindergarten: keep the registry row but take OSM's
 * precise position (registry positions are only geocoded from the address) and contact details it lacks.
 */
export function mergeSources(osm: PlaceRow[], registry: PlaceRow[]): PlaceRow[] {
  const used = new Set<string>();
  const merged = registry.map((r) => {
    const twin = osm.find((o) => !used.has(o.placeId) && normName(o.name) === normName(r.name) && km(o, r) < 3);
    if (!twin) return r;
    used.add(twin.placeId);
    return { ...r, lat: twin.lat, lng: twin.lng, locationApprox: false, phone: r.phone ?? twin.phone, hoursOpen: twin.hoursOpen, hoursClose: twin.hoursClose };
  });
  return [...merged, ...osm.filter((o) => !used.has(o.placeId))];
}

export const REAL_KINDERGARTENS: readonly Kindergarten[] = buildReal(
  mergeSources(placesJson as PlaceRow[], registryJson as PlaceRow[]), curatedJson as Record<string, Curated>,
);
