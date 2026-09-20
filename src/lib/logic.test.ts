import { describe, expect, it } from "vitest";
import { I18N } from "@/content/i18n";
import { CRITERIA } from "@/content/criteria";
import { SAMPLE_KINDERGARTENS as ALL, DEFAULT_CENTRE } from "@/data/seed";
import { annualCost, costLines, isPartialCost } from "./cost";
import { buildReal } from "@/data/real";
import { fmtTime } from "./format";
import { km } from "./geo";
import { stats, stampIsPass } from "./scoring";
import { ANY_DISTANCE, DEFAULT_FILTERS, search } from "./filter";
import { buildCompare } from "./compare";
import { geocode } from "./geocode";

const by = (id: string) => ALL.find((k) => k.id === id)!;

describe("content", () => {
  it("has 9 criteria, 2 critical (reg, safe)", () => {
    expect(CRITERIA).toHaveLength(9);
    expect(CRITERIA.filter((c) => c.major).map((c) => c.k)).toEqual(["reg", "safe"]);
  });
  it("ms and en dictionaries have identical keys", () => {
    expect(Object.keys(I18N.en).sort()).toEqual(Object.keys(I18N.ms).sort());
  });
});

describe("cost", () => {
  it("matches the prototype for t1 (no transport / with transport)", () => {
    // 300 + 280*12 + 250 + 150 + 150 = 4210 ; + 120*12 = 5650
    expect(annualCost(by("t1"), false)).toBe(4210);
    expect(annualCost(by("t1"), true)).toBe(5650);
  });
  it("ignores transport when not offered", () => {
    expect(annualCost(by("t2"), true)).toBe(annualCost(by("t2"), false));
  });
  it("respects billableMonths", () => {
    const k = { ...by("t1"), billableMonths: 11 };
    expect(annualCost(k, false)).toBe(4210 - 280);
  });
  it("line items sum to the total", () => {
    const lines = costLines(by("t6"), true, I18N.en);
    expect(lines.reduce((s, l) => s + (l.off ? 0 : (l.value ?? 0)), 0)).toBe(annualCost(by("t6"), true));
  });
});

describe("scoring", () => {
  it("t1 is a clean pass", () => {
    const s = stats(by("t1"));
    expect(s).toMatchObject({ y: 9, n: 0, q: 0, major: false });
    expect(stampIsPass(s)).toBe(true);
  });
  it("derives ratio status from the ratio (t3 = 1:18 → flag)", () => {
    expect(by("t3").statuses.ratio).toBe("flag");
    expect(by("t7").statuses.ratio).toBe("ok"); // 1:15 is the upper bound
  });
  it("a critical flag sets major regardless of score", () => {
    expect(stats(by("t7")).major).toBe(true);
    expect(stats(by("t4")).major).toBe(true);
    expect(stats(by("t3")).major).toBe(false);
  });
  it("overrides take precedence and can clear a critical flag", () => {
    const t7 = by("t7");
    const s = stats(t7, { statuses: { reg: "ok", safe: "ok" } });
    expect(s.major).toBe(false);
  });
});

describe("format", () => {
  it("formats time per locale", () => {
    expect(fmtTime("07:30", "ms", I18N.ms)).toBe("7:30 pg");
    expect(fmtTime("12:30", "ms", I18N.ms)).toBe("12:30 tgh");
    expect(fmtTime("18:00", "ms", I18N.ms)).toBe("6:00 ptg");
    expect(fmtTime("07:30", "en", I18N.en)).toBe("7:30 AM");
    expect(fmtTime("18:00", "en", I18N.en)).toBe("6:00 PM");
  });
});

describe("search", () => {
  const label = () => "";
  it("hides major red flags by default and counts them", () => {
    const { rows, hiddenMajor } = search(ALL, { ...DEFAULT_FILTERS, maxDist: ANY_DISTANCE }, DEFAULT_CENTRE, {}, label);
    expect(hiddenMajor).toBe(2); // t4, t7
    expect(rows.find((r) => r.k.id === "t4")).toBeUndefined();
  });
  it("sorts by cost ascending", () => {
    const { rows } = search(ALL, { ...DEFAULT_FILTERS, hideMajor: false, maxDist: ANY_DISTANCE, sort: "cost" }, DEFAULT_CENTRE, {}, label);
    expect(rows[0].k.id).toBe("t5");
  });
  it("needTransport excludes kindergartens without transport", () => {
    const { rows } = search(ALL, { ...DEFAULT_FILTERS, hideMajor: false, maxDist: ANY_DISTANCE, needTransport: true }, DEFAULT_CENTRE, {}, label);
    expect(rows.some((r) => r.k.id === "t2" || r.k.id === "t5")).toBe(false);
  });
  it("haversine is sane (~1° lat ≈ 111 km)", () => {
    expect(km({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 1);
  });
});

describe("compare", () => {
  it("verdict skips critical-flag listings", () => {
    const { pick } = buildCompare([by("t1"), by("t7")], DEFAULT_CENTRE, {}, false);
    expect(pick.k.id).toBe("t1");
  });
  it("no verdict when all have critical flags", () => {
    expect(buildCompare([by("t4"), by("t7")], DEFAULT_CENTRE, {}, false).pick).toBeUndefined();
  });
});

describe("real data (trust rules)", () => {
  const place = { placeId: "p1", name: "Tadika X", area: "Alor Setar", address: null, lat: 6.12, lng: 100.36, phone: null, hoursOpen: null, hoursClose: null, fetchedAt: "2026-09-20T00:00:00Z" };
  it("a place with no curated facts is Unsure on every criterion and has unknown costs", () => {
    const [k] = buildReal([place], {});
    expect(Object.values(k.statuses).every((s) => s === "unsure")).toBe(true);
    expect(k.source).toBe("google_places");
    expect(annualCost(k, false)).toBeNull();
    expect(stats(k)).toMatchObject({ y: 0, n: 0, q: 9, major: false });
  });
  it("KPM registry check is the only thing that sets reg, and marks source official_registry", () => {
    const [ok] = buildReal([place], { p1: { kpmRegistered: true } });
    const [bad] = buildReal([place], { p1: { kpmRegistered: false } });
    expect(ok.statuses.reg).toBe("ok"); expect(ok.source).toBe("official_registry");
    expect(bad.statuses.reg).toBe("flag"); expect(stats(bad).major).toBe(true);
  });
  it("ratio is derived only when known", () => {
    expect(buildReal([place], { p1: { teacherStudentRatio: 12 } })[0].statuses.ratio).toBe("ok");
    expect(buildReal([place], { p1: { teacherStudentRatio: 20 } })[0].statuses.ratio).toBe("flag");
  });
  it("exclude drops the place", () => {
    expect(buildReal([place], { p1: { exclude: true } })).toHaveLength(0);
  });
  it("partial costs are flagged and unknown cost never wins in compare or hides under a budget", () => {
    const [k] = buildReal([place], { p1: { monthlyFee: 300 } });
    expect(isPartialCost(k)).toBe(true);
    expect(annualCost(k, false)).toBe(3600);
    const [u] = buildReal([{ ...place, placeId: "p2" }], {});
    const c = buildCompare([k, u], DEFAULT_CENTRE, {}, false);
    expect(c.best.annual).toBe(3600);
    const { rows } = search([u], { ...DEFAULT_FILTERS, maxBudget: 2000, maxDist: ANY_DISTANCE }, DEFAULT_CENTRE, {}, () => "");
    expect(rows).toHaveLength(1);
  });
});

describe("osm listings", () => {
  const mk = (name: string) => ({ placeId: "osm:node/1", source: "openstreetmap" as const, name, area: "", address: null, lat: 6.1, lng: 100.3, phone: null, hoursOpen: null, hoursClose: null, fetchedAt: "2026-09-20T00:00:00Z" });
  it("keeps the openstreetmap source until a registry check upgrades it", () => {
    expect(buildReal([mk("Tadika X")], {})[0].source).toBe("openstreetmap");
    expect(buildReal([mk("Tadika X")], { "osm:node/1": { kpmRegistered: true } })[0].source).toBe("official_registry");
  });
  it("infers government only for agency names; never marks registered or passes anything", () => {
    const gov = buildReal([mk("Tabika KEMAS Tok Seron")], {})[0];
    expect(gov.type).toBe("government");
    expect(gov.kpmRegistered).toBeNull();
    expect(stats(gov).y).toBe(0);
    expect(buildReal([mk("Tadika Marian")], {})[0].type).toBe("private");
    expect(buildReal([mk("Tabika Perpaduan Taman Selamat")], {})[0].type).toBe("government");
    expect(buildReal([mk("Prasekolah Sekolah Kebangsaan Tanah Merah")], {})[0].type).toBe("government");
  });
});

describe("distance 'All'", () => {
  it("includes places farther than 999 km (e.g. Sabah from Kedah)", () => {
    const far = { ...by("t1"), id: "far", lat: 5.98, lng: 116.07 }; // Kota Kinabalu
    const { rows } = search([far], { ...DEFAULT_FILTERS, maxDist: ANY_DISTANCE }, DEFAULT_CENTRE, {}, () => "");
    expect(rows).toHaveLength(1);
    expect(rows[0].d).toBeGreaterThan(1000);
  });
});

describe("geocode", () => {
  const ok = (body: unknown) => (async () => ({ ok: true, status: 200, json: async () => body })) as unknown as typeof fetch;
  it("returns short labels and numeric coordinates, restricted to Malaysia", async () => {
    let seen = "";
    const f = (async (u: string) => { seen = u; return { ok: true, status: 200, json: async () => [
      { lat: "6.1962529", lon: "100.4087329", display_name: "Kolej Tentera Udara Alor Setar, Kampung Titi Gajah, Kota Setar, Kedah, Malaysia" },
    ] }; }) as unknown as typeof fetch;
    const r = await geocode("KTU", f);
    expect(seen).toContain("countrycodes=my");
    expect(r).toEqual([{ label: "Kolej Tentera Udara Alor Setar, Kampung Titi Gajah, Kota Setar", lat: 6.1962529, lng: 100.4087329 }]);
  });
  it("skips empty queries without a network call, dedupes labels, and drops bad coordinates", async () => {
    await expect(geocode("  ", (() => { throw new Error("no network"); }) as unknown as typeof fetch)).resolves.toEqual([]);
    const r = await geocode("x", ok([
      { lat: "1", lon: "2", display_name: "A, B" }, { lat: "3", lon: "4", display_name: "A, B" }, { lat: "nope", lon: "4", display_name: "C" },
    ]));
    expect(r).toHaveLength(1);
  });
  it("throws on HTTP errors", async () => {
    await expect(geocode("x", (async () => ({ ok: false, status: 429 })) as unknown as typeof fetch)).rejects.toThrow("429");
  });
});
