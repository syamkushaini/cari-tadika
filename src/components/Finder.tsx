"use client";
import { useEffect, useMemo, useState } from "react";
import { useLocalStorageRaw } from "@/lib/localStore";
import { CRITERIA } from "@/content/criteria";
import { I18N } from "@/content/i18n";
import { DEFAULT_CENTRE } from "@/data/seed";
import { annualCost } from "@/lib/cost";
import { ANY_DISTANCE, DEFAULT_FILTERS, search, type Filters, type SortKey } from "@/lib/filter";
import { typeLabel } from "@/lib/format";
import { geocode, type Place } from "@/lib/geocode";
import { useOverrides } from "@/lib/overrides";
import type { Kindergarten, Lang } from "@/lib/types";
import { CompareDialog } from "./CompareDialog";
import { DetailDialog } from "./DetailDialog";
import { KindergartenCard } from "./KindergartenCard";

const LS_LANG = "cariTadika.lang";
const MAX_COMPARE = 3;
const PAGE = 50;
type LocBtn = "useLoc" | "locating" | "locUpdate" | "locBlocked" | "locUnsupported";

export function Finder({ kindergartens }: { kindergartens: readonly Kindergarten[] }) {
  const [storedLang, storeLang] = useLocalStorageRaw(LS_LANG);
  const lang: Lang = storedLang === "en" ? "en" : "ms";
  const t = I18N[lang];
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const chooseLang = (l: Lang) => storeLang(l);

  const [f, setF] = useState<Filters>(DEFAULT_FILTERS);
  // Rendering thousands of cards at once is slow, so the list grows in pages and resets on any filter change.
  const [shown, setShown] = useState(PAGE);
  const set = <K extends keyof Filters>(key: K, v: Filters[K]) => { setShown(PAGE); setF((p) => ({ ...p, [key]: v })); };

  const [loc, setLoc] = useState(DEFAULT_CENTRE);
  const [usingCurrent, setUsingCurrent] = useState(false);
  // Typed location: query text, matches to choose from, and the label of the one chosen.
  const [locQuery, setLocQuery] = useState("");
  const [locMatches, setLocMatches] = useState<Place[]>([]);
  const [locState, setLocState] = useState<"idle" | "loading" | "none" | "error">("idle");
  const [customLabel, setCustomLabel] = useState<string | null>(null);
  const originName = customLabel ?? (usingCurrent ? t.currentLoc : t.defaultLoc);
  const applyOrigin = (p: { lat: number; lng: number }, label: string | null, gps: boolean) => {
    setLoc({ lat: p.lat, lng: p.lng }); setShown(PAGE); setCustomLabel(label); setUsingCurrent(gps);
  };
  const findLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locQuery.trim()) return;
    setLocState("loading"); setLocMatches([]);
    try {
      const r = await geocode(locQuery);
      setLocMatches(r);
      setLocState(r.length ? "idle" : "none");
      if (r.length === 1) { applyOrigin(r[0], r[0].label, false); setLocMatches([]); }
    } catch { setLocState("error"); }
  };
  const [locBtn, setLocBtn] = useState<LocBtn>("useLoc");
  const useMyLocation = () => {
    if (!navigator.geolocation) return setLocBtn("locUnsupported");
    setLocBtn("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => { applyOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }, null, true); setLocBtn("locUpdate"); },
      () => setLocBtn("locBlocked"),
      { timeout: 10000 },
    );
  };

  const ov = useOverrides();
  const [cmp, setCmp] = useState<string[]>([]);
  const [cmpNotice, setCmpNotice] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cmpOpen, setCmpOpen] = useState(false);
  const toggleCmp = (id: string, on: boolean) => {
    if (!on) { setCmp((c) => c.filter((x) => x !== id)); return setCmpNotice(false); }
    if (cmp.length >= MAX_COMPARE) return setCmpNotice(true);
    setCmpNotice(false);
    setCmp((c) => [...c, id]);
  };

  const { rows, hiddenMajor } = useMemo(
    () => search(kindergartens, f, loc, ov.map, (k) => typeLabel(k, t)),
    [kindergartens, f, loc, ov.map, t],
  );
  const byId = (id: string) => kindergartens.find((k) => k.id === id)!;
  const cmpKs = cmp.map(byId);
  const openK = openId ? byId(openId) : null;
  const barText = cmpNotice ? t.maxCmp : cmp.length < 2 ? `${cmpKs[0]?.name ?? ""} ${t.pilihMin}` : cmpKs.map((k) => k.name).join(" vs ");

  return (
    <>
      <header className="hero">
        <div className="hero-in">
          <div className="brand-row">
            <h1>Cari Tadika</h1>
            <div className="langsw" role="group" aria-label={t.langAria}>
              {(["ms", "en"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={lang === l} onClick={() => chooseLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <p className="lede">{t.lede}</p>
          {kindergartens.every((k) => k.source === "sample") && <span className="sample-note">{t.sample}</span>}
          <div className="searchbox">
            <label htmlFor="q" className="sr-only">{t.qLabel}</label>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            <input id="q" type="search" value={f.q} placeholder={t.qLabel} onChange={(e) => set("q", e.target.value)} />
          </div>
        </div>
      </header>

      <div className="wrap">
        <section className="controls" aria-label={t.filtersAria}>
          <details className="panel origin">
            <summary>
              <span className="loc-label">{t.distFrom} <b>{originName}</b></span>
              <svg className="ico chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="loc">
              <button className="btn small" type="button" onClick={useMyLocation}>
                <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 21s7-6.8 7-12.4A7 7 0 1 0 5 8.6C5 14.2 12 21 12 21Z" /><circle cx="12" cy="8.6" r="2.4" /></svg>
                <span>{t[locBtn]}</span>
              </button>
            </div>
            <form className="loc-form" onSubmit={findLocation}>
              <div className="field">
                <label htmlFor="locq">{t.locInputLabel}</label>
                <div className="loc-row">
                  <input id="locq" type="search" value={locQuery} placeholder={t.locInputPlaceholder} enterKeyHint="search"
                    onChange={(e) => setLocQuery(e.target.value)} />
                  <button className="btn small primary" type="submit" disabled={locState === "loading"}>{locState === "loading" ? t.locSearching : t.locSearch}</button>
                </div>
              </div>
              <div aria-live="polite">
                {locState === "none" && <p className="src">{t.locNone}</p>}
                {locState === "error" && <p className="src">{t.locError}</p>}
                {locMatches.length > 1 && (
                  <div className="loc-results" role="group" aria-label={t.locPick}>
                    <p className="src">{t.locPick}</p>
                    {locMatches.map((m) => (
                      <button key={`${m.lat},${m.lng}`} type="button" className="btn small loc-pick"
                        onClick={() => { applyOrigin(m, m.label, false); setLocMatches([]); }}>{m.label}</button>
                    ))}
                  </div>
                )}
                {(customLabel || usingCurrent) && (
                  <button className="btn small" type="button" onClick={() => { applyOrigin(DEFAULT_CENTRE, null, false); setLocQuery(""); setLocBtn("useLoc"); }}>{t.locDefaultBtn}</button>
                )}
              </div>
            </form>
          </details>

          <div className="grp">
            <span className="grp-label" id="g-dist">{t.jarak}</span>
            <div className="pillrow scroll" role="radiogroup" aria-labelledby="g-dist">
              {[3, 5, 10, 25, ANY_DISTANCE].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={f.maxDist === n} className="pill" onClick={() => set("maxDist", n)}>{n === ANY_DISTANCE ? t.distAll : `${n} km`}</button>
              ))}
            </div>
          </div>
          <div className="grp">
            <span className="grp-label" id="g-bud">{t.budgetShort}</span>
            <div className="pillrow scroll" role="radiogroup" aria-labelledby="g-bud">
              {[2000, 4000, 6000, 10000, 999999].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={f.maxBudget === n} className="pill" onClick={() => set("maxBudget", n)}>{n === 999999 ? t.distAll : `< RM ${(n / 1000)}k`}</button>
              ))}
            </div>
          </div>
          <div className="pillrow">
            <label htmlFor="sort" className="grp-label">{t.sortLabel}</label>
            <select id="sort" className="sortsel" value={f.sort} onChange={(e) => set("sort", e.target.value as SortKey)}>
              <option value="score">{t.sortScore}</option><option value="dist">{t.sortDist}</option><option value="cost">{t.sortCost}</option>
            </select>
          </div>
          <div className="pillrow">
            {([["onlyReg", t.onlyReg], ["hideMajor", t.hideMajor], ["onlyTrial", t.onlyTrial], ["needTransport", t.needTrans]] as const).map(([key, label]) => (
              <button key={key} type="button" className="pill toggle" aria-pressed={f[key]} onClick={() => set(key, !f[key])}>{label}</button>
            ))}
          </div>
        </section>

        <p className="count" aria-live="polite">{t.countFound(rows.length)}{hiddenMajor ? t.countHidden(hiddenMajor) : ""}</p>
        <div className="list">
          {rows.length ? rows.slice(0, shown).map((row) => (
            <KindergartenCard key={row.k.id} row={row} annual={annualCost(row.k, f.needTransport)} lang={lang} t={t}
              ov={ov.map[row.k.id]} compared={cmp.includes(row.k.id)} onOpen={() => setOpenId(row.k.id)}
              onToggleCompare={(on) => toggleCmp(row.k.id, on)} />
          )) : <div className="empty">{t.emptyMsg}</div>}
          {rows.length > shown && (
            <button className="btn" type="button" onClick={() => setShown((n) => n + PAGE)}>{t.showMore(Math.min(PAGE, rows.length - shown))}</button>
          )}
        </div>

        <details className="guide">
          <summary>{t.guideTitle}</summary>
          <p className="credit">{t.guideCredit}</p>
          <ol>
            {CRITERIA.map((c) => (
              <li key={c.k}><b>{c[lang].t}{c.major ? t.kritikalSuffix : ""}</b><span>{c[lang].tip}</span></li>
            ))}
          </ol>
        </details>
        {kindergartens.some((k) => k.source === "openstreetmap") && <p className="credit" style={{ marginTop: 14 }}>{t.osmCredit}</p>}
      </div>

      <div className="bar" hidden={cmp.length === 0}>
        <div className="bar-in">
          <span className="bar-names">{barText}</span>
          <div className="row-actions">
            <button className="btn small" type="button" onClick={() => { setCmp([]); setCmpNotice(false); }}>{t.kosongkan}</button>
            <button className="btn primary" type="button" disabled={cmp.length < 2} onClick={() => setCmpOpen(true)}>{t.banding}</button>
          </div>
        </div>
      </div>

      <DetailDialog k={openK} lang={lang} t={t} loc={loc} ov={openK ? ov.map[openK.id] : undefined} withTransport={f.needTransport}
        compared={openK ? cmp.includes(openK.id) : false} onClose={() => setOpenId(null)}
        onSetStatus={ov.setStatus} onSetNote={ov.setNote} onReset={ov.resetStatuses} onToggleCompare={toggleCmp} />
      <CompareDialog ks={cmpKs} open={cmpOpen} lang={lang} t={t} loc={loc} ov={ov.map} withTransport={f.needTransport} onClose={() => setCmpOpen(false)} />
    </>
  );
}
