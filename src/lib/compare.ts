import { annualCost } from "./cost";
import { km, type LatLng } from "./geo";
import { stats, type Stats } from "./scoring";
import type { Kindergarten, OverrideMap } from "./types";

export type CompareRow = { k: Kindergarten; d: number; st: Stats; annual: number | null };

const minKnown = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? Math.min(...v) : null;
};

export function buildCompare(ks: Kindergarten[], loc: LatLng, ov: OverrideMap, withTransport: boolean) {
  const rows: CompareRow[] = ks.map((k) => ({ k, d: km(loc, k), st: stats(k, ov[k.id]), annual: annualCost(k, withTransport) }));
  // `null` best = nothing to highlight; unknown values never win.
  const best = {
    score: Math.max(...rows.map((r) => r.st.y)),
    fee: minKnown(rows.map((r) => r.k.monthlyFee)),
    annual: minKnown(rows.map((r) => r.annual)),
    dist: Math.min(...rows.map((r) => r.d)),
    ratio: minKnown(rows.map((r) => r.k.teacherStudentRatio)),
  };
  // Verdict: among listings without a critical flag, most passes, then fewest flags, then cheapest known cost.
  const pick = rows
    .filter((r) => !r.st.major)
    .sort((a, b) => b.st.y - a.st.y || a.st.n - b.st.n || (a.annual ?? Infinity) - (b.annual ?? Infinity))[0];
  const known = rows.map((r) => r.annual).filter((x): x is number => x != null);
  const spread = known.length > 1 ? Math.max(...known) - Math.min(...known) : null;
  return { rows, best, pick, spread };
}
