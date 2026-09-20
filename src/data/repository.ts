// Data-access seam. Real listings (Google Places + curated facts) win when present;
// otherwise fall back to the fictional sample set so the app is never empty in dev.
// Swap this module for a DB/API later without touching UI code.
import type { Kindergarten } from "@/lib/types";
import { REAL_KINDERGARTENS } from "./real";
import { SAMPLE_KINDERGARTENS } from "./seed";

export function listKindergartens(): readonly Kindergarten[] {
  return REAL_KINDERGARTENS.length ? REAL_KINDERGARTENS : SAMPLE_KINDERGARTENS;
}
export const isSampleData = (ks: readonly Kindergarten[]) => ks.every((k) => k.source === "sample");
