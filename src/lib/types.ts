export type Lang = "ms" | "en";
export type Status = "ok" | "flag" | "unsure";
export type KgType = "government" | "private";
export type KgModifier = "none" | "montessori" | "waldorf" | "islamic";
export type CurriculumCode =
  | "kspk" | "kspk_montessori" | "kspk_waldorf" | "kspk_tahfiz" | "kspk_fardu"
  | "none_stated" | "unclear";
export type DataSource = "sample" | "google_places" | "openstreetmap" | "manual" | "owner_submitted" | "parent_verified" | "official_registry";

export type Kindergarten = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  type: KgType;
  modifier: KgModifier;
  /** Contact/identity from the listing source (Google Places for real data). */
  address: string | null;
  phone: string | null;
  placeId: string | null;
  /** ISO timestamp the source data was fetched; Places data should be refreshed regularly. */
  fetchedAt: string | null;
  /** Fees and ratio are null when not yet known. Never guess. */
  monthlyFee: number | null;
  teacherStudentRatio: number | null;
  curriculumCode: CurriculumCode;
  hoursOpen: string | null; // "HH:MM" 24h
  hoursClose: string | null;
  /** null = unverified */
  kpmRegistered: boolean | null;
  registrationFee: number | null;
  annualBooksCost: number | null;
  annualUniformCost: number | null;
  annualActivitiesCost: number | null;
  /** null = not offered or unknown */
  monthlyTransportCost: number | null;
  /** Spec §5.4: some centres bill 11 months. Defaults to 12. */
  billableMonths: number;
  source: DataSource;
  /** KPM institution code from ePrasekolah (e.g. "K5A2010"), when known. */
  institutionCode?: string | null;
  /** Places open for enrolment, as listed in the registry. */
  vacancies?: number | null;
  /** True when the map position is neighbourhood/area level, not the exact building. */
  locationApprox?: boolean;
  /** Base/official status per criterion key. */
  statuses: Record<string, Status>;
};

/** A parent's own edits for one kindergarten (spec: UserOverride). */
export type Override = {
  statuses?: Record<string, Status>;
  note?: string;
};
export type OverrideMap = Record<string, Override>;
