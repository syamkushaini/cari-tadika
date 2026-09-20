import type { Dict } from "@/content/i18n";
import { annualCost } from "./cost";
import { km, type LatLng } from "./geo";
import { statusOf, stats, type Stats } from "./scoring";
import type { Kindergarten, OverrideMap } from "./types";

export type SortKey = "score" | "dist" | "cost";
export type Filters = {
  q: string; maxDist: number; maxBudget: number; sort: SortKey;
  onlyReg: boolean; hideMajor: boolean; onlyTrial: boolean; needTransport: boolean;
};
/** "All" distances. Must exceed any distance within Malaysia (Perlis to Sabah is ~2,000 km). */
export const ANY_DISTANCE = 100000;
export const DEFAULT_FILTERS: Filters = {
  q: "", maxDist: 10, maxBudget: 999999, sort: "score",
  onlyReg: false, hideMajor: true, onlyTrial: false, needTransport: false,
};

export type FilterChip = { key: keyof Filters; label: string; clear: Partial<Filters> };

/** Removable chips for every filter that differs from "show everything" (hide-major counts: it is on by default). */
export function activeFilterChips(f: Filters, t: Dict): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.hideMajor) chips.push({ key: "hideMajor", label: t.hideMajor, clear: { hideMajor: false } });
  if (f.maxDist !== ANY_DISTANCE) chips.push({ key: "maxDist", label: t.withinKm(f.maxDist), clear: { maxDist: ANY_DISTANCE } });
  if (f.maxBudget !== DEFAULT_FILTERS.maxBudget) chips.push({ key: "maxBudget", label: t.budgetChip(f.maxBudget.toLocaleString("en-MY")), clear: { maxBudget: DEFAULT_FILTERS.maxBudget } });
  if (f.onlyReg) chips.push({ key: "onlyReg", label: t.onlyReg, clear: { onlyReg: false } });
  if (f.onlyTrial) chips.push({ key: "onlyTrial", label: t.onlyTrial, clear: { onlyTrial: false } });
  if (f.needTransport) chips.push({ key: "needTransport", label: t.needTrans, clear: { needTransport: false } });
  return chips;
}

export type Row = { k: Kindergarten; d: number; st: Stats };

/** `label` is the locale-aware type text so search matches what the user sees. */
export function search(
  all: readonly Kindergarten[], f: Filters, loc: LatLng, ov: OverrideMap, label: (k: Kindergarten) => string,
): { rows: Row[]; hiddenMajor: number } {
  const q = f.q.trim().toLowerCase();
  let hiddenMajor = 0;
  const rows = all
    .map((k) => ({ k, d: km(loc, k), st: stats(k, ov[k.id]) }))
    .filter(({ k, d, st }) => {
      if (q && !`${k.name} ${k.area} ${label(k)}`.toLowerCase().includes(q)) return false;
      const cost = annualCost(k, f.needTransport);
      // Unknown cost can't be ruled out by budget, so it stays visible.
      if (d > f.maxDist || (cost != null && cost > f.maxBudget)) return false;
      if (f.needTransport && k.monthlyTransportCost == null) return false;
      if (f.onlyReg && statusOf(k, "reg", ov[k.id]) !== "ok") return false;
      if (f.onlyTrial && statusOf(k, "trial", ov[k.id]) !== "ok") return false;
      if (f.hideMajor && st.major) { hiddenMajor++; return false; }
      return true;
    });
  const wt = f.needTransport;
  rows.sort((a, b) =>
    f.sort === "dist" ? a.d - b.d
    : f.sort === "cost" ? (annualCost(a.k, wt) ?? Infinity) - (annualCost(b.k, wt) ?? Infinity) || a.d - b.d
    : Number(a.st.major) - Number(b.st.major) || b.st.y - a.st.y || a.st.n - b.st.n || a.d - b.d);
  return { rows, hiddenMajor };
}
