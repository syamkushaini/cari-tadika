"use client";
import { CRITERIA } from "@/content/criteria";
import type { Dict } from "@/content/i18n";
import { otherCosts, rmOr } from "@/lib/cost";
import { buildCompare } from "@/lib/compare";
import { currLabel, distLabel, esc, hoursLabel, ratioLabel } from "@/lib/format";
import { type LatLng } from "@/lib/geo";
import { statusOf } from "@/lib/scoring";
import type { Kindergarten, Lang, OverrideMap } from "@/lib/types";
import { Dialog } from "./Dialog";

export function CompareDialog({ ks, open, lang, t, loc, ov, withTransport, onClose }: {
  ks: Kindergarten[]; open: boolean; lang: Lang; t: Dict; loc: LatLng; ov: OverrideMap; withTransport: boolean; onClose: () => void;
}) {
  const show = open && ks.length >= 2;
  const c = show ? buildCompare(ks, loc, ov, withTransport) : null;
  const win = (cond: boolean) => (cond ? "win" : "");
  const isBest = (v: number | null, best: number | null) => v != null && best != null && v === best;
  const num = (v: string) => <span className="num">{v}</span>;
  const label = { ok: t.statusY, flag: t.statusN, unsure: t.statusQ };

  // Verdict copy contains <b> markup; the name is escaped before injection.
  const verdict = c && (c.pick
    ? `${t.pilihanTerbaik(esc(c.pick.k.name), c.pick.st.y, c.pick.st.n, c.pick.st.q)} ${c.pick.st.q ? t.sahkanBelumPasti : t.tetapLawat} ${c.spread != null ? t.bezaKos(rmOr(c.spread, t)) : ""}`
    : t.semuaFlagBesar);

  return (
    <Dialog open={show} onClose={onClose} closeLabel={t.tutup} title={<h2>{t.perbandingan}</h2>}>
      {c && (
        <>
          <div className="verdict">
            <p className="kicker">{t.putusan}</p>
            <p dangerouslySetInnerHTML={{ __html: verdict! }} />
          </div>
          <p className="src">{t.hijauTerbaik}</p>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th></th>{c.rows.map((r) => <th key={r.k.id}>{r.k.name}</th>)}</tr></thead>
              <tbody>
                <tr><th>{t.colSkor}</th>{c.rows.map((r) => <td key={r.k.id} className={win(r.st.y === c.best.score)}>{num(`${r.st.y}/9`)}{r.st.major ? ` · ${t.kritikal}` : ""}</td>)}</tr>
                <tr><th>{t.colJarak}</th>{c.rows.map((r) => <td key={r.k.id} className={win(r.d === c.best.dist)}>{num(distLabel(r.k, r.d))}</td>)}</tr>
                <tr><th>{t.colKos}{withTransport ? t.colKosTrans : ""}</th>{c.rows.map((r) => (
                  <td key={r.k.id} className={win(isBest(r.annual, c.best.annual))}>{num(rmOr(r.annual, t))}
                    {withTransport && r.k.monthlyTransportCost == null && <><br /><span className="src">{t.tiadaTransSrc}</span></>}
                  </td>))}</tr>
                <tr><th>{t.colYuran}</th>{c.rows.map((r) => <td key={r.k.id} className={win(isBest(r.k.monthlyFee, c.best.fee))}>{num(rmOr(r.k.monthlyFee, t))}</td>)}</tr>
                <tr><th>{t.colDaftar}</th>{c.rows.map((r) => <td key={r.k.id}>{num(rmOr(r.k.registrationFee, t))}</td>)}</tr>
                <tr><th>{t.colLain}</th>{c.rows.map((r) => <td key={r.k.id}>{num(rmOr(otherCosts(r.k), t))}</td>)}</tr>
                <tr><th>{t.colTrans}</th>{c.rows.map((r) => <td key={r.k.id}>{r.k.monthlyTransportCost == null ? t.tiadaTrans : num(rmOr(r.k.monthlyTransportCost, t))}</td>)}</tr>
                <tr><th>{t.colNisbah}</th>{c.rows.map((r) => <td key={r.k.id} className={win(isBest(r.k.teacherStudentRatio, c.best.ratio))}>{num(ratioLabel(r.k, t))}</td>)}</tr>
                <tr><th>{t.colKurikulum}</th>{c.rows.map((r) => <td key={r.k.id}>{currLabel(r.k.curriculumCode, t)}</td>)}</tr>
                <tr><th>{t.colWaktu}</th>{c.rows.map((r) => <td key={r.k.id}>{hoursLabel(r.k, lang, t)}</td>)}</tr>
                {CRITERIA.map((cr, i) => (
                  <tr key={cr.k}><th>{i + 1}. {cr[lang].t}</th>{c.rows.map((r) => {
                    const v = statusOf(r.k, cr.k, ov[r.k.id]);
                    return <td key={r.k.id}><span className={`cell ${v}`}>{label[v]}</span></td>;
                  })}</tr>
                ))}
                <tr><th>{t.colNota}</th>{c.rows.map((r) => <td key={r.k.id}>{ov[r.k.id]?.note || t.notaKosong}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </Dialog>
  );
}
