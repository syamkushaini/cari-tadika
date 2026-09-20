import type { Dict } from "@/content/i18n";
import type { Kindergarten } from "./types";

export const rm = (n: number) => "RM " + Math.round(n).toLocaleString("en-MY");
/** Money that may be unknown. */
export const rmOr = (n: number | null, t: Dict) => (n == null ? t.unknown : rm(n));

export type CostLine = { label: string; value: number | null; off: boolean };

/** Line-item breakdown. Transport is only counted when requested AND offered. */
export function costLines(k: Kindergarten, withTransport: boolean, t: Dict): CostLine[] {
  const months = k.billableMonths;
  const trans = k.monthlyTransportCost;
  return [
    { label: t.costReg, value: k.registrationFee, off: false },
    { label: k.monthlyFee == null ? t.costMonthlyUnknown : t.costMonthly(rm(k.monthlyFee), months), value: k.monthlyFee == null ? null : k.monthlyFee * months, off: false },
    { label: t.costBooks, value: k.annualBooksCost, off: false },
    { label: t.costUniform, value: k.annualUniformCost, off: false },
    { label: t.costActivities, value: k.annualActivitiesCost, off: false },
    trans == null
      ? { label: t.costTransNone, value: 0, off: true }
      : { label: t.costTrans(rm(trans), months), value: trans * months, off: !withTransport },
  ];
}

/**
 * Annual total, or null when the monthly fee is unknown (no meaningful total exists).
 * Unknown add-ons count as 0; check `isPartialCost` to warn that the total may be understated.
 */
export function annualCost(k: Kindergarten, withTransport: boolean): number | null {
  if (k.monthlyFee == null) return null;
  const trans = withTransport && k.monthlyTransportCost != null ? k.monthlyTransportCost * k.billableMonths : 0;
  return (
    (k.registrationFee ?? 0) + k.monthlyFee * k.billableMonths +
    (k.annualBooksCost ?? 0) + (k.annualUniformCost ?? 0) + (k.annualActivitiesCost ?? 0) + trans
  );
}

export const isPartialCost = (k: Kindergarten) =>
  k.monthlyFee != null &&
  [k.registrationFee, k.annualBooksCost, k.annualUniformCost, k.annualActivitiesCost].some((v) => v == null);

/** Sum of the three add-on items, or null if none is known. */
export function otherCosts(k: Kindergarten): number | null {
  const v = [k.annualBooksCost, k.annualUniformCost, k.annualActivitiesCost];
  return v.every((x) => x == null) ? null : v.reduce<number>((s, x) => s + (x ?? 0), 0);
}
