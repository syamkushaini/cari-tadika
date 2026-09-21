import type { Kindergarten } from "./types";

export const DATA_URL = "https://syamkushaini.github.io/cari-tadika/data/kindergartens.json";

const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const isNullNum = (v: unknown) => v == null || isNum(v);

/**
 * Accepts the published JSON only if it looks like a real listings file; anything else returns null
 * so the app keeps using what it already has. A bad download must never blank the app.
 */
export function parseRemoteListings(json: unknown): Kindergarten[] | null {
  const list = (json as { listings?: unknown })?.listings;
  if (!Array.isArray(list) || list.length === 0) return null;
  for (const k of list as Partial<Kindergarten>[]) {
    if (!k || typeof k.id !== "string" || typeof k.name !== "string" || !isNum(k.lat) || !isNum(k.lng)) return null;
    if (!k.statuses || typeof k.statuses !== "object") return null;
    if (!isNullNum(k.monthlyFee) || !isNullNum(k.teacherStudentRatio) || typeof k.billableMonths !== "number") return null;
  }
  return list as Kindergarten[];
}
