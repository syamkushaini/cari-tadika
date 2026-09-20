"use client";
import { useEffect, useMemo, useState } from "react";
import { useLocalStorageRaw } from "@/lib/localStore";
import { CRITERIA } from "@/content/criteria";
import { I18N } from "@/content/i18n";
import { DEFAULT_CENTRE } from "@/data/seed";
import { annualCost } from "@/lib/cost";
import { ANY_DISTANCE, DEFAULT_FILTERS, search, type Filters, type SortKey } from "@/lib/filter";
import { typeLabel } from "@/lib/format";
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
  const [locBtn, setLocBtn] = useState<LocBtn>("useLoc");
  const useMyLocation = () => {
    if (!navigator.geolocation) return setLocBtn("locUnsupported");
    setLocBtn("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setShown(PAGE); setUsingCurrent(true); setLocBtn("locUpdate"); },
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
      <div className="wrap">
        <header className="masthead">
          <div className="brand-row">
            <div className="brand">
              <div className="seal" aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 14 16 7l10 7" /><path d="M9 14v9h14v-9" /><path d="M13 23v-6h6v6" /></svg>
              </div>
              <h1>Cari Tadika</h1>
            </div>
            <div className="langsw" role="group" aria-label={t.langAria}>
              {(["ms", "en"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={lang === l} onClick={() => chooseLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <p className="lede">{t.lede}</p>
          <span className="sample-note">{kindergartens.every((k) => k.source === "sample") ? t.sample : t.unverified}</span>
        </header>

        <section className="controls" aria-label={t.filtersAria}>
          <div className="loc">
            <div className="loc-label">{t.distFrom} <b>{usingCurrent ? t.currentLoc : t.defaultLoc}</b></div>
            <button className="btn small" type="button" onClick={useMyLocation}>
              <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 21s7-6.8 7-12.4A7 7 0 1 0 5 8.6C5 14.2 12 21 12 21Z" /><circle cx="12" cy="8.6" r="2.4" /></svg>
              <span>{t[locBtn]}</span>
            </button>
          </div>
          <div className="filters">
            <div className="field q"><label htmlFor="q">{t.qLabel}</label>
              <input id="q" type="search" value={f.q} placeholder={t.qPlaceholder} onChange={(e) => set("q", e.target.value)} /></div>
            <div className="field"><label htmlFor="dist">{t.distLabel}</label>
              <select id="dist" value={f.maxDist} onChange={(e) => set("maxDist", +e.target.value)}>
                {[3, 5, 10, 25].map((n) => <option key={n} value={n}>{n} km</option>)}
                <option value={ANY_DISTANCE}>{t.distAll}</option>
              </select></div>
            <div className="field"><label htmlFor="budget">{t.budgetLabel}</label>
              <select id="budget" value={f.maxBudget} onChange={(e) => set("maxBudget", +e.target.value)}>
                {[2000, 4000, 6000, 10000].map((n) => <option key={n} value={n}>RM {n.toLocaleString("en-MY")}</option>)}
                <option value={999999}>{t.distAll}</option>
              </select></div>
            <div className="field"><label htmlFor="sort">{t.sortLabel}</label>
              <select id="sort" value={f.sort} onChange={(e) => set("sort", e.target.value as SortKey)}>
                <option value="score">{t.sortScore}</option><option value="dist">{t.sortDist}</option><option value="cost">{t.sortCost}</option>
              </select></div>
          </div>
          <div className="toggles">
            <label className="tog"><input type="checkbox" checked={f.onlyReg} onChange={(e) => set("onlyReg", e.target.checked)} /><span>{t.onlyReg}</span></label>
            <label className="tog"><input type="checkbox" checked={f.hideMajor} onChange={(e) => set("hideMajor", e.target.checked)} /><span>{t.hideMajor}</span></label>
            <label className="tog"><input type="checkbox" checked={f.onlyTrial} onChange={(e) => set("onlyTrial", e.target.checked)} /><span>{t.onlyTrial}</span></label>
            <label className="tog"><input type="checkbox" checked={f.needTransport} onChange={(e) => set("needTransport", e.target.checked)} /><span>{t.needTrans}</span></label>
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
