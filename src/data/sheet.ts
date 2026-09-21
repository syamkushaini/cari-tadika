// Spreadsheet <-> curated-data rules, shared by the export/import scripts and the tests.
// No file access here: everything works on plain strings so it is easy to test.
//
// Trust rule: a BLANK cell means "unknown / not checked". It never becomes 0, "ok" or "registered".
import type { CurriculumCode, KgModifier, KgType, Status } from "@/lib/types";
import type { Curated } from "./real";

export const STATUS_COLUMNS = ["curr", "safe", "clean", "trial", "assess", "staff", "menu"] as const;
export const CURRICULA: CurriculumCode[] = ["kspk", "kspk_montessori", "kspk_waldorf", "kspk_tahfiz", "kspk_fardu", "none_stated", "unclear"];
export const TYPES: KgType[] = ["government", "private"];
export const MODIFIERS: KgModifier[] = ["none", "montessori", "waldorf", "islamic"];

/** Editable columns, in sheet order. `key` is the header text used in the file. */
export const EDIT_COLUMNS = [
  "hide", "type", "modifier", "curriculum", "kpm_registered",
  "monthly_fee", "registration_fee", "books_per_year", "uniform_per_year", "activities_per_year", "transport_per_month", "billable_months",
  "teacher_student_ratio", "hours_open", "hours_close", "phone",
  ...STATUS_COLUMNS.map((s) => `check_${s}`),
  "source_note", "verified_on",
] as const;
export type EditKey = (typeof EDIT_COLUMNS)[number];
export type RawRow = Partial<Record<EditKey, string>>;

const blank = (v: string | undefined) => v == null || v.trim() === "";
const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");

const YES = new Set(["yes", "y", "true", "1", "ya"]);
const NO = new Set(["no", "n", "false", "0", "tidak"]);
export const parseYesNo = (v: string): boolean | undefined => (YES.has(norm(v)) ? true : NO.has(norm(v)) ? false : undefined);

/** "RM 1,200" / "1200" / "1200.50" -> number, or undefined when not numeric. */
export function parseMoney(v: string): number | undefined {
  const s = v.replace(/rm/i, "").replace(/[,\s]/g, "");
  return /^\d+(\.\d+)?$/.test(s) ? Number(s) : undefined;
}
/** "1:12" or "12" -> 12. */
export function parseRatio(v: string): number | undefined {
  const m = /^(?:1\s*:\s*)?(\d+)$/.exec(v.trim());
  return m ? Number(m[1]) : undefined;
}
/** "07:30", "7:30", "7.30", "7:30 pm", "19:00" -> "HH:MM" 24h. */
export function parseTime(v: string): string | undefined {
  const m = /^(\d{1,2})[:.](\d{2})\s*(am|pm|pg|ptg)?$/i.exec(v.trim());
  if (!m) return undefined;
  let h = Number(m[1]); const min = Number(m[2]); const p = m[3]?.toLowerCase();
  if (p === "pm" || p === "ptg") { if (h < 12) h += 12; } else if ((p === "am" || p === "pg") && h === 12) h = 0;
  return h > 23 || min > 59 ? undefined : `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
export const parseStatus = (v: string): Status | undefined => {
  const s = norm(v);
  return s === "ok" ? "ok" : s === "flag" || s === "red flag" ? "flag" : s === "unsure" || s === "belum pasti" ? "unsure" : undefined;
};
const parseType = (v: string): KgType | undefined => {
  const s = norm(v);
  return s === "government" || s === "kerajaan" ? "government" : s === "private" || s === "swasta" ? "private" : undefined;
};
const parseModifier = (v: string): KgModifier | undefined => {
  const s = norm(v);
  return s === "islamik" ? "islamic" : (MODIFIERS as string[]).includes(s) ? (s as KgModifier) : undefined;
};

const MONEY: { col: EditKey; key: keyof Curated; max: number }[] = [
  { col: "monthly_fee", key: "monthlyFee", max: 20000 },
  { col: "registration_fee", key: "registrationFee", max: 20000 },
  { col: "books_per_year", key: "annualBooksCost", max: 20000 },
  { col: "uniform_per_year", key: "annualUniformCost", max: 20000 },
  { col: "activities_per_year", key: "annualActivitiesCost", max: 20000 },
  { col: "transport_per_month", key: "monthlyTransportCost", max: 5000 },
];

/** Turn one spreadsheet row into a curated entry. `curated` is null when the row has no values. */
export function parseRow(raw: RawRow): { curated: Curated | null; errors: string[] } {
  const errors: string[] = [];
  const c: Record<string, unknown> = {};
  const has = (k: EditKey) => !blank(raw[k]);
  const bad = (k: EditKey, why: string) => errors.push(`${k}: "${raw[k]}" ${why}`);

  if (has("hide")) { const b = parseYesNo(raw.hide!); if (b === undefined) bad("hide", "must be yes or no"); else if (b) c.exclude = true; }
  if (has("type")) { const v = parseType(raw.type!); if (!v) bad("type", "must be government or private"); else c.type = v; }
  if (has("modifier")) { const v = parseModifier(raw.modifier!); if (!v) bad("modifier", `must be one of ${MODIFIERS.join(", ")}`); else c.modifier = v; }
  if (has("curriculum")) { const v = norm(raw.curriculum!); if (!(CURRICULA as string[]).includes(v)) bad("curriculum", `must be one of ${CURRICULA.join(", ")}`); else c.curriculumCode = v; }
  if (has("kpm_registered")) { const b = parseYesNo(raw.kpm_registered!); if (b === undefined) bad("kpm_registered", "must be yes or no (leave blank if not checked)"); else c.kpmRegistered = b; }
  for (const { col, key, max } of MONEY) {
    if (!has(col)) continue;
    const n = parseMoney(raw[col]!);
    if (n === undefined || n > max) bad(col, `must be a number from 0 to ${max}`); else c[key] = n;
  }
  if (has("billable_months")) { const n = Number(raw.billable_months); if (!Number.isInteger(n) || n < 1 || n > 12) bad("billable_months", "must be a whole number from 1 to 12"); else c.billableMonths = n; }
  if (has("teacher_student_ratio")) { const n = parseRatio(raw.teacher_student_ratio!); if (n === undefined || n < 1 || n > 60) bad("teacher_student_ratio", "must be like 12 or 1:12 (1 to 60)"); else c.teacherStudentRatio = n; }
  for (const [col, key] of [["hours_open", "hoursOpen"], ["hours_close", "hoursClose"]] as const) {
    if (!has(col)) continue;
    const t = parseTime(raw[col]!);
    if (!t) bad(col, "must be a time like 07:30 or 7:30 pm"); else c[key] = t;
  }
  if (has("hours_open") !== has("hours_close")) errors.push("hours_open and hours_close must be filled together");
  if (has("phone")) c.phone = raw.phone!.trim();
  const statuses: Record<string, Status> = {};
  for (const s of STATUS_COLUMNS) {
    const col = `check_${s}` as EditKey;
    if (!has(col)) continue;
    const v = parseStatus(raw[col]!);
    if (!v) bad(col, "must be ok, flag or unsure"); else statuses[s] = v;
  }
  if (Object.keys(statuses).length) c.statuses = statuses;
  if (has("source_note")) c.note = raw.source_note!.trim();
  if (has("verified_on")) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.verified_on!.trim())) bad("verified_on", "must be a date like 2026-09-21");
    else c.verifiedOn = raw.verified_on!.trim();
  }
  return { curated: Object.keys(c).length ? (c as Curated) : null, errors };
}

/** Inverse of parseRow: curated entry -> the text shown in each sheet cell. */
export function curatedToRow(c: Curated | undefined): RawRow {
  if (!c) return {};
  const r: RawRow = {};
  const set = (k: EditKey, v: unknown) => { if (v !== undefined && v !== null && v !== "") r[k] = String(v); };
  if (c.exclude) set("hide", "yes");
  set("type", c.type); set("modifier", c.modifier); set("curriculum", c.curriculumCode);
  if (c.kpmRegistered !== undefined && c.kpmRegistered !== null) set("kpm_registered", c.kpmRegistered ? "yes" : "no");
  for (const { col, key } of MONEY) set(col, c[key]);
  set("billable_months", c.billableMonths); set("teacher_student_ratio", c.teacherStudentRatio);
  set("hours_open", c.hoursOpen); set("hours_close", c.hoursClose); set("phone", c.phone);
  for (const s of STATUS_COLUMNS) set(`check_${s}` as EditKey, c.statuses?.[s]);
  set("source_note", c.note); set("verified_on", c.verifiedOn);
  return r;
}

/** Stable id for a kindergarten added by hand: manual:<slug>. */
export const manualId = (name: string, address: string) =>
  "manual:" + `${name} ${address}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
