import { CRITERIA } from "@/content/criteria";
import type { Dict } from "@/content/i18n";
import { rmOr } from "@/lib/cost";
import { fmtKm } from "@/lib/geo";
import { ratioLabel, tagTypeLabel } from "@/lib/format";
import { statusOf } from "@/lib/scoring";
import type { Row } from "@/lib/filter";
import type { Lang, Override } from "@/lib/types";
import { Stamp } from "./Stamp";

export function KindergartenCard({ row, annual, lang, t, ov, compared, onOpen, onToggleCompare }: {
  row: Row; annual: number | null; lang: Lang; t: Dict; ov?: Override; compared: boolean;
  onOpen: () => void; onToggleCompare: (on: boolean) => void;
}) {
  const { k, d, st } = row;
  const hasMine = !!ov?.statuses && Object.keys(ov.statuses).length > 0;
  return (
    <article className={`file${st.major ? " flagged" : ""}`} data-flagged-label={t.flaggedRibbon}>
      <span className="tag-type">{tagTypeLabel(k, t)}</span>
      <Stamp st={st} t={t} />
      <div className="file-main">
        <h2>{k.name}</h2>
        <dl className="ledger">
          <div><dt>{t.kawasan}</dt><dd>{k.area}</dd></div>
          <div><dt>{t.jarak}</dt><dd>{fmtKm(d)}</dd></div>
          <div><dt>{t.kosTahun}</dt><dd>{rmOr(annual, t)}</dd></div>
          <div><dt>{t.nisbah}</dt><dd>{ratioLabel(k, t)}</dd></div>
        </dl>
        <div className="tags">
          {CRITERIA.map((c) => statusOf(k, c.k, ov) === "flag" && <span key={c.k} className="tag flag">✕ {c[lang].short}</span>)}
          {st.q > 0 && <span className="tag unk">{t.belumSemak(st.q)}</span>}
          {!st.n && !st.q && <span className="tag ok">{t.noFlag}</span>}
          {hasMine && <span className="tag mine">{t.adaSemakan}</span>}
        </div>
        <div className="file-actions">
          <button className="btn primary small" type="button" onClick={onOpen}>{t.bukaFail}</button>
          <label className="cmp">
            <input type="checkbox" checked={compared} onChange={(e) => onToggleCompare(e.target.checked)} />
            <span>{t.banding}</span>
          </label>
        </div>
      </div>
    </article>
  );
}
