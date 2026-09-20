import type { Status } from "@/lib/types";

/** KPM recommends up to 1:15. Unknown ratio is "unsure", never a pass. */
export const ratioStatus = (ratio: number | null): Status => (ratio == null ? "unsure" : ratio <= 15 ? "ok" : "flag");
