import { annualCost } from "./cost";
import { km, type LatLng } from "./geo";
import { statusOf, stats, type Stats } from "./scoring";
import type { Kindergarten, OverrideMap } from "./types";

export type SortKey = "score" | "dist" | "cost";
export type Filters = {
  q: string; maxDist: number; maxBudget: number; sort: SortKey;
  onlyReg: boolean; hideMajor: boolean; onlyTrial: boolean; needTransport: boolean;
};
export const DEFAULT_FILTERS: Filters = {
  q: "", maxDist: 10, maxBudget: 999999, sort: "score",
  onlyReg: false, hideMajor: true, onlyTrial: false, needTransport: false,
};

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
