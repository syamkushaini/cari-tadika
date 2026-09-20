import { Text, View } from "react-native";
import { CRITERIA } from "@/content/criteria";
import type { Dict } from "@/content/i18n";
import { buildCompare } from "@/lib/compare";
import { otherCosts, rmOr } from "@/lib/cost";
import { currLabel, hoursLabel, ratioLabel } from "@/lib/format";
import { fmtKm, type LatLng } from "@/lib/geo";
import { statusOf } from "@/lib/scoring";
import type { Kindergarten, Lang, OverrideMap } from "@/lib/types";
import { font, useColors } from "./theme";
import { RichText, Sheet } from "./ui";

/** Phone layout: one block per attribute, one equal column per kindergarten (no sideways scroll). */
export function CompareSheet({ ks, visible, lang, t, loc, ov, withTransport, onClose }: {
  ks: Kindergarten[]; visible: boolean; lang: Lang; t: Dict; loc: LatLng; ov: OverrideMap; withTransport: boolean; onClose: () => void;
}) {
  const c = useColors();
  const show = visible && ks.length >= 2;
  const cmp = show ? buildCompare(ks, loc, ov, withTransport) : null;
  const isBest = (v: number | null, best: number | null) => v != null && best != null && v === best;
  const label = { ok: t.statusY, flag: t.statusN, unsure: t.statusQ };

  const Row = ({ name, cells }: { name: string; cells: { text: string; win?: boolean; color?: string; bg?: string; mono?: boolean }[] }) => (
    <View style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: 8, gap: 4 }}>
      <Text style={{ fontFamily: font.sansSemi, fontSize: 12, color: c.muted }}>{name}</Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {cells.map((cell, i) => (
          <View key={i} style={{ flex: 1, padding: 6, borderRadius: 4, backgroundColor: cell.bg ?? (cell.win ? c.accentSoft : "transparent") }}>
            <Text style={{ fontFamily: cell.mono === false ? font.sans : font.mono, fontSize: 13, color: cell.color ?? c.ink }}>{cell.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Sheet visible={show} onClose={onClose} title={t.perbandingan} closeLabel={t.tutup}>
      {cmp && (
        <>
          <View style={{ backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accent, borderRadius: 8, padding: 14, gap: 4 }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 10.5, letterSpacing: 0.6, color: c.accent }}>{t.putusan.toUpperCase()}</Text>
            <RichText style={{ fontFamily: font.sans, fontSize: 14, color: c.ink }}
              text={cmp.pick
                ? `${t.pilihanTerbaik(cmp.pick.k.name, cmp.pick.st.y, cmp.pick.st.n, cmp.pick.st.q)} ${cmp.pick.st.q ? t.sahkanBelumPasti : t.tetapLawat} ${cmp.spread != null ? t.bezaKos(rmOr(cmp.spread, t)) : ""}`
                : t.semuaFlagBesar} />
          </View>
          <Text style={{ fontFamily: font.mono, fontSize: 11, color: c.muted, marginTop: -8 }}>{t.greenBest}</Text>

          <View style={{ flexDirection: "row", gap: 6, borderBottomWidth: 2, borderBottomColor: c.ink, paddingBottom: 8 }}>
            {cmp.rows.map((r) => <Text key={r.k.id} style={{ flex: 1, fontFamily: font.serif, fontSize: 14, color: c.ink }}>{r.k.name}</Text>)}
          </View>
          <View>
            <Row name={t.colSkor} cells={cmp.rows.map((r) => ({ text: `${r.st.y}/9${r.st.major ? ` · ${t.kritikal}` : ""}`, win: r.st.y === cmp.best.score }))} />
            <Row name={t.colJarak} cells={cmp.rows.map((r) => ({ text: fmtKm(r.d), win: r.d === cmp.best.dist }))} />
            <Row name={t.colKos + (withTransport ? t.colKosTrans : "")} cells={cmp.rows.map((r) => ({ text: rmOr(r.annual, t), win: isBest(r.annual, cmp.best.annual) }))} />
            <Row name={t.colYuran} cells={cmp.rows.map((r) => ({ text: rmOr(r.k.monthlyFee, t), win: isBest(r.k.monthlyFee, cmp.best.fee) }))} />
            <Row name={t.colDaftar} cells={cmp.rows.map((r) => ({ text: rmOr(r.k.registrationFee, t) }))} />
            <Row name={t.colLain} cells={cmp.rows.map((r) => ({ text: rmOr(otherCosts(r.k), t) }))} />
            <Row name={t.colTrans} cells={cmp.rows.map((r) => ({ text: r.k.monthlyTransportCost == null ? t.tiadaTrans : rmOr(r.k.monthlyTransportCost, t) }))} />
            <Row name={t.colNisbah} cells={cmp.rows.map((r) => ({ text: ratioLabel(r.k, t), win: isBest(r.k.teacherStudentRatio, cmp.best.ratio) }))} />
            <Row name={t.colKurikulum} cells={cmp.rows.map((r) => ({ text: currLabel(r.k.curriculumCode, t), mono: false }))} />
            <Row name={t.colWaktu} cells={cmp.rows.map((r) => ({ text: hoursLabel(r.k, lang, t) }))} />
            {CRITERIA.map((cr, i) => (
              <Row key={cr.k} name={`${i + 1}. ${cr[lang].t}`} cells={cmp.rows.map((r) => {
                const v = statusOf(r.k, cr.k, ov[r.k.id]);
                return { text: label[v], bg: { ok: c.accentSoft, flag: c.flagBg, unsure: c.unkBg }[v], color: { ok: c.accent, flag: c.flag, unsure: c.unk }[v] };
              })} />
            ))}
            <Row name={t.colNota} cells={cmp.rows.map((r) => ({ text: ov[r.k.id]?.note || t.notaKosong, mono: false }))} />
          </View>
        </>
      )}
    </Sheet>
  );
}
