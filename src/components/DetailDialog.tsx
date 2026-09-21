"use client";
import { CRITERIA } from "@/content/criteria";
import type { Dict } from "@/content/i18n";
import { annualCost, costLines, isPartialCost, rm, rmOr } from "@/lib/cost";
import { type LatLng, km } from "@/lib/geo";
import { currLabel, distLabel, hoursLabel, ratioFull, typeLabel } from "@/lib/format";
import { stats, statusOf } from "@/lib/scoring";
import type { Kindergarten, Lang, Override, Status } from "@/lib/types";
import { Dialog } from "./Dialog";

const STATUSES: Status[] = ["ok", "flag", "unsure"];

export function DetailDialog({ k, lang, t, loc, ov, withTransport, compared, onClose, onSetStatus, onSetNote, onReset, onToggleCompare }: {
  k: Kindergarten | null; lang: Lang; t: Dict; loc: LatLng; ov?: Override; withTransport: boolean; compared: boolean;
  onClose: () => void; onSetStatus: (k: Kindergarten, key: string, v: Status) => void;
  onSetNote: (id: string, note: string) => void; onReset: (id: string) => void; onToggleCompare: (id: string, on: boolean) => void;
}) {
  const statusLabel: Record<Status, string> = { ok: t.statusY, flag: t.statusN, unsure: t.statusQ };
  const body = k && (() => {
    const st = stats(k, ov);
    const annual = annualCost(k, withTransport);
    return (
      <>
        <dl className="facts">
          <div className="fact"><dt>{t.skorLbl}</dt><dd>{st.y}/9 {t.lulus}{st.major ? ` · ${t.kritikal}` : ""}</dd></div>
          <div className="fact"><dt>{t.yuran}</dt><dd>{k.monthlyFee == null ? t.unknown : `${rm(k.monthlyFee)} ${t.perBulan}`}</dd></div>
          <div className="fact"><dt>{t.kosSetahun}</dt><dd>{rmOr(annual, t)}</dd></div>
          <div className="fact"><dt>{t.nisbah}</dt><dd>{ratioFull(k, t)}</dd></div>
          <div className="fact"><dt>{t.kurikulum}</dt><dd>{currLabel(k.curriculumCode, t)}</dd></div>
          <div className="fact"><dt>{t.waktu}</dt><dd>{hoursLabel(k, lang, t)}</dd></div>
        </dl>
        <div className="row-actions">
          {k.phone && <a className="btn small" href={`tel:${k.phone.replace(/[^+\d]/g, "")}`}>{t.call} · {k.phone}</a>}
          <a className="btn small" href={`https://www.google.com/maps/search/?api=1&query=${k.lat},${k.lng}`} target="_blank" rel="noopener">{t.googleMaps}</a>
          <a className="btn small" href="https://eprasekolah.moe.gov.my/" target="_blank" rel="noopener">{t.eprasekolah}</a>
        </div>
        <div className="sec-title">{t.anggaranKos} <small>{withTransport ? t.termasukTrans : t.tanpaTrans}</small></div>
        <div className="costs">
          {costLines(k, withTransport, t).map((l) => (
            <div key={l.label} className={`cost-row${l.off ? " off" : ""}`}>
              <span className="lbl">{l.label}</span><span className="num">{l.off ? "–" : rmOr(l.value, t)}</span>
            </div>
          ))}
          <div className="cost-row total"><span className="lbl">{t.jumlahSetahun}</span><span className="num">{rmOr(annual, t)}</span></div>
        </div>
        <p className="monthly">{annual == null ? t.noVerdictData : t.purataSebulan(rm(annual / k.billableMonths))}{isPartialCost(k) ? ` ${t.costPartial}` : ""}</p>
        <div className="sec-title">{t.failSemakan} <small>{t.tekanKemaskini}</small></div>
        <div className="checks">
          {CRITERIA.map((c, i) => {
            const v = statusOf(k, c.k, ov);
            const mine = !!ov?.statuses?.[c.k];
            return (
              <div key={c.k} className="check" data-s={v}>
                <div className="check-top">
                  <div className="check-name">{i + 1}. {c[lang].t}{c.major && <span className="major-tag">{t.criticalTag}</span>}</div>
                  <div className="seg" role="group" aria-label={c[lang].t}>
                    {STATUSES.map((o) => (
                      <button key={o} type="button" data-v={o} aria-pressed={v === o} onClick={() => onSetStatus(k, c.k, o)}>{statusLabel[o]}</button>
                    ))}
                  </div>
                </div>
                <p className="check-tip">{c[lang].tip}</p>
                <div className="src">{mine ? t.semakanAnda : t.dataAsal}{c.k === "ratio" && k.teacherStudentRatio != null ? ` · ${t.ratioWord} 1:${k.teacherStudentRatio}` : ""}</div>
              </div>
            );
          })}
        </div>
        <div className="field">
          <label htmlFor={`note-${k.id}`}>{t.notaLawatan}</label>
          <textarea id={`note-${k.id}`} value={ov?.note ?? ""} placeholder={t.notaPlaceholder} onChange={(e) => onSetNote(k.id, e.target.value)} />
        </div>
        <div className="row-actions">
          <button className="btn small" type="button" onClick={() => onReset(k.id)}>{t.setSemula}</button>
          <label className="cmp">
            <input type="checkbox" checked={compared} onChange={(e) => onToggleCompare(k.id, e.target.checked)} />
            <span>{t.tambahBanding}</span>
          </label>
        </div>
      </>
    );
  })();

  return (
    <Dialog open={!!k} onClose={onClose} closeLabel={t.tutup}
      title={k && <>
        <h2>{k.name}</h2>
        <div><span>{k.area ? `${k.area} · ` : ""}{typeLabel(k, t)}</span><span> · <b>{distLabel(k, km(loc, k))}</b> {t.dariAnda}</span></div>
        {k.institutionCode && <div className="src">{t.instCode}: {k.institutionCode}{k.vacancies != null ? ` · ${t.vacanciesLbl}: ${k.vacancies}` : ""}</div>}
        {k.locationApprox && <div className="src">{t.approxNote}</div>}
      </>}>
      {body}
    </Dialog>
  );
}
