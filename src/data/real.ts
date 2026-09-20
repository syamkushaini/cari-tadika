// Builds real listings from two sources:
//   generated/places.json  – fetched by `npm run fetch:places` (name, location, phone, hours). Unverified.
//   curated.json           – facts YOU verified, keyed by Google place id. The ONLY way a criterion becomes "ok".
// Trust rule: every criterion starts "unsure". Nothing is passed by default.
import { CRITERIA } from "@/content/criteria";
import type { CurriculumCode, DataSource, Kindergarten, KgModifier, KgType, Status } from "@/lib/types";
import { ratioStatus } from "./ratio";
import placesJson from "./generated/places.json";
import curatedJson from "./curated.json";

export type PlaceRow = {
  placeId: string; name: string; area: string; address: string | null; lat: number; lng: number;
  phone: string | null; hoursOpen: string | null; hoursClose: string | null; fetchedAt: string;
};

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
    if (c.kpmRegistered != null) statuses.reg = c.kpmRegistered ? "ok" : "flag";
    if (c.teacherStudentRatio != null) statuses.ratio = ratioStatus(c.teacherStudentRatio);
    Object.assign(statuses, c.statuses);
    const source: DataSource = c.source ?? (c.kpmRegistered != null ? "official_registry" : "google_places");
    return [{
      id: p.placeId, placeId: p.placeId, name: c.name ?? p.name, area: c.area ?? p.area,
      address: p.address, phone: p.phone, fetchedAt: p.fetchedAt, lat: p.lat, lng: p.lng,
      type: c.type ?? "private", modifier: c.modifier ?? "none",
      monthlyFee: c.monthlyFee ?? null, teacherStudentRatio: c.teacherStudentRatio ?? null,
      curriculumCode: c.curriculumCode ?? "none_stated",
      hoursOpen: p.hoursOpen, hoursClose: p.hoursClose,
      kpmRegistered: c.kpmRegistered ?? null,
      registrationFee: c.registrationFee ?? null, annualBooksCost: c.annualBooksCost ?? null,
      annualUniformCost: c.annualUniformCost ?? null, annualActivitiesCost: c.annualActivitiesCost ?? null,
      monthlyTransportCost: c.monthlyTransportCost ?? null,
      billableMonths: c.billableMonths ?? 12,
      source, statuses,
    }];
  });
}

export const REAL_KINDERGARTENS: readonly Kindergarten[] = buildReal(
  placesJson as PlaceRow[], curatedJson as Record<string, Curated>,
);
