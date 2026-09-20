import { CRITERIA } from "@/content/criteria";
import type { Kindergarten, Override, Status } from "./types";

export const statusOf = (k: Kindergarten, key: string, ov?: Override): Status =>
  ov?.statuses?.[key] ?? k.statuses[key];

export type Stats = { y: number; n: number; q: number; major: boolean; score: number };

/** score = count of "ok" out of 9; a critical criterion flagged marks `major`. */
export function stats(k: Kindergarten, ov?: Override): Stats {
  let y = 0, n = 0, q = 0, major = false;
  for (const c of CRITERIA) {
    const v = statusOf(k, c.k, ov);
    if (v === "ok") y++;
    else if (v === "flag") { n++; if (c.major) major = true; }
    else q++;
  }
  return { y, n, q, major, score: Math.round((y / CRITERIA.length) * 100) };
}

export type Tone = "pass" | "check" | "critical";

/** Badge colour tier (prototype stampColor). */
export function tone(s: Stats): "flag" | "unk" | "accent" {
  if (s.major) return "flag";
  if (s.q > 2) return "unk";
  if (s.score >= 78) return "accent";
  if (s.score >= 55) return "unk";
  return "flag";
}

/** Badge wording: PASS only when clean and nothing unchecked. */
export const stampIsPass = (s: Stats) => !s.major && s.score >= 78 && !s.q;
