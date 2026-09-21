import { CRITERIA } from "@/content/criteria";
import type { Dict } from "@/content/i18n";
import { rmTotal } from "@/lib/cost";
import { distLabel, ratioLabel, tabLabel } from "@/lib/format";
import { stampIsPass, type Stats } from "@/lib/scoring";
import { statusOf } from "@/lib/scoring";
import type { Row } from "@/lib/filter";
import type { Lang, Override } from "@/lib/types";

const tone = (st: Stats) => (st.major ? "bad" : stampIsPass(st) ? "ok" : "");

export function KindergartenCard({ row, annual, lang, t, ov, compared, onOpen, onToggleCompare }: {
  row: Row; annual: number | null; lang: Lang; t: Dict; ov?: Override; compared: boolean;
  onOpen: () => void; onToggleCompare: (on: boolean) => void;
}) {
  const { k, d, st } = row;
  const hasMine = !!ov?.statuses && Object.keys(ov.statuses).length > 0;
  const flags = CRITERIA.filter((c) => statusOf(k, c.k, ov) === "flag");
  const reg = statusOf(k, "reg", ov) === "ok";
  const trial = statusOf(k, "trial", ov) === "ok";
  const state = st.major ? "flagged" : stampIsPass(st) ? "ok" : "";
  return (
    <article className={`file ${state}`} aria-label={k.name}>
      <div className="file-top">
        <div className="tags-left">
          <span className="badge">{tabLabel(k, t)}</span>
          {st.major && <span className="badge review">{t.flaggedRibbon}</span>}
        </div>
        <span className={`score ${tone(st)}`} role="img" aria-label={t.stampAria(st.y, st.major)}>{st.y}/9</span>
      </div>
      <div className="file-body">
        <h2>{k.name}</h2>
        <div className="meta">
          <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>
          <span>{k.area ? `${k.area} · ` : ""}<span className="mono">{distLabel(k, d)}</span></span>
        </div>
      </div>
      <dl className="stats">
        <div><dt>{t.kosTahun}</dt><dd className={annual == null ? "unknown" : ""}>{rmTotal(k, annual, t)}</dd></div>
        <div><dt>{t.nisbah}</dt><dd className={k.teacherStudentRatio == null ? "unknown" : ""}>{ratioLabel(k, t)}</dd></div>
      </dl>
      <div className="file-foot">
        <div className={`status ${st.major || st.n ? "flag" : st.q ? "unk" : "ok"}`}>
          {!st.n && !st.q && <span>✓ {t.noFlag.replace(/^✓\s*/, "")}</span>}
          {st.n > 0 && <span>✕ {flags.map((c) => c[lang].short).join(" · ")}</span>}
          {st.q > 0 && <span>{st.n > 0 ? "· " : ""}{t.belumSemak(st.q)}</span>}
        </div>
        {(reg || trial || hasMine) && (
          <div className="chips">
            {reg && <span className="chip ok">✓ {t.kpmChip}</span>}
            {trial && <span className="chip ok">✓ {t.trialChip}</span>}
            {hasMine && <span className="chip mine">{t.adaSemakan}</span>}
          </div>
        )}
        <div className="file-actions">
          <button className="btn soft" type="button" onClick={onOpen} aria-label={`${t.bukaFail}: ${k.name}`}>{t.bukaFail}</button>
          <button className="btn cmp" type="button" aria-pressed={compared} aria-label={`${t.banding}: ${k.name}`} onClick={() => onToggleCompare(!compared)}>
            {compared ? `✓ ${t.comparedBtn}` : t.banding}
          </button>
        </div>
      </div>
    </article>
  );
}
