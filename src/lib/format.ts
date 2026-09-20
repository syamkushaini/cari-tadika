import type { Dict } from "@/content/i18n";
import type { CurriculumCode, Kindergarten, Lang } from "./types";

/** "07:30" → "7:30 pg" (ms) / "7:30 AM" (en). */
export function fmtTime(hhmm: string, lang: Lang, t: Dict): string {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, "0");
  if (lang === "en") return `${h12}:${mm} ${h < 12 ? "AM" : "PM"}`;
  const p = t.timePeriods;
  return `${h12}:${mm} ${h < 12 ? p.am : h === 12 ? p.noon : p.pm}`;
}

export const hoursLabel = (k: Kindergarten, lang: Lang, t: Dict) =>
  k.hoursOpen && k.hoursClose ? `${fmtTime(k.hoursOpen, lang, t)} – ${fmtTime(k.hoursClose, lang, t)}` : t.unknown;

export function typeLabel(k: Kindergarten, t: Dict): string {
  const base = k.type === "government" ? t.typeKerajaan : t.typeSwasta;
  if (k.modifier === "none") return base;
  const word = { montessori: t.modMontessori, waldorf: t.modWaldorf, islamic: t.modIslamik }[k.modifier];
  return k.modifier === "islamic" ? `${base} ${word}` : `${base} (${word})`;
}

export const tagTypeLabel = (k: Kindergarten, t: Dict) =>
  (k.type === "government" ? t.typeKerajaan : t.typeSwasta).toUpperCase();

export function currLabel(code: CurriculumCode, t: Dict): string {
  return {
    kspk: "KSPK",
    kspk_montessori: `KSPK + ${t.modMontessori}`,
    kspk_waldorf: `KSPK + ${t.modWaldorf}`,
    kspk_tahfiz: t.currTahfiz,
    kspk_fardu: t.currFardu,
    none_stated: t.currNone,
    unclear: t.currUnclear,
  }[code];
}

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** "1:12" or "not yet known". */
export const ratioLabel = (k: Kindergarten, t: Dict) => (k.teacherStudentRatio == null ? t.unknown : `1:${k.teacherStudentRatio}`);
export const ratioFull = (k: Kindergarten, t: Dict) => (k.teacherStudentRatio == null ? t.unknown : t.nisbahFull(k.teacherStudentRatio));
