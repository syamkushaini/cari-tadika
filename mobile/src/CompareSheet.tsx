import { Text, View } from "react-native";
import { CRITERIA } from "@/content/criteria";
import type { Dict } from "@/content/i18n";
import { buildCompare } from "@/lib/compare";
import { otherCosts, rm, rmTotal } from "@/lib/cost";
import { currLabel, distLabel, hoursLabel, ratioLabel, tabLabel } from "@/lib/format";
import { type LatLng } from "@/lib/geo";
import { statusOf } from "@/lib/scoring";
import type { Kindergarten, Lang, OverrideMap } from "@/lib/types";
import { folder, font, useColors } from "./theme";
import { RichText, Sheet } from "./ui";

type Kind = "best" | "unk" | "bad" | "txt" | "" | "ok" | "flag" | "unsure";
type Cell = { text?: string | null; kind?: Kind };

/** Phone layout: one block per attribute, one equal column per kindergarten (no sideways scroll). */
export function CompareSheet({ ks, visible, lang, t, loc, ov, withTransport, onClose }: {
  ks: Kindergarten[]; visible: boolean; lang: Lang; t: Dict; loc: LatLng; ov: OverrideMap; withTransport: boolean; onClose: () => void;
}) {
  const c = useColors();
  const show = visible && ks.length >= 2;
  const cmp = show ? buildCompare(ks, loc, ov, withTransport) : null;
  const isBest = (v: number | null, best: number | null) => v != null && best != null && v === best;
  const label = { ok: `✓ ${t.statusY}`, flag: `✕ ${t.statusN}`, unsure: `? ${t.statusQ}` };
  const val = (text: string | null | undefined, kind: Kind = ""): Cell => (text ? { text, kind } : { kind: "unk" });

  const Cells = ({ cells }: { cells: Cell[] }) => (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {cells.map((cell, i) => {
        const k = cell.kind ?? "";
        const style = {
          best: { bg: c.accentSoft, bd: c.accent, fg: c.accent, ds: "solid" }, ok: { bg: c.accentSoft, bd: c.accent, fg: c.accent, ds: "solid" },
          bad: { bg: c.flagBg, bd: c.flag, fg: c.flag, ds: "solid" }, flag: { bg: c.flagBg, bd: c.flag, fg: c.flag, ds: "solid" },
          unk: { bg: "transparent", bd: c.line, fg: c.muted, ds: "dashed" }, unsure: { bg: "transparent", bd: c.line, fg: c.unk, ds: "dashed" },
          txt: { bg: c.surface, bd: c.line, fg: c.ink, ds: "solid" }, "": { bg: c.surface, bd: c.line, fg: c.ink, ds: "solid" },
        }[k];
        const pill = k === "ok" || k === "flag" || k === "unsure";
        return (
          <View key={i} style={{ flex: 1, minHeight: 44, padding: 8, justifyContent: "center", alignItems: pill ? "center" : "flex-start", ...folder(4, 10), borderWidth: 1.5,
            borderStyle: style.ds as "solid" | "dashed", borderColor: style.bd, backgroundColor: style.bg }}>
            {k === "unk"
              ? <Text style={{ fontFamily: font.sansItalic, fontSize: 13, color: style.fg }}>{t.unknown}</Text>
              : <Text style={{ fontFamily: k === "txt" || pill ? font.sansSemi : k === "best" || k === "bad" ? font.mono : font.monoMed, fontSize: pill ? 12.5 : k === "txt" ? 13 : 14, color: style.fg, textAlign: pill ? "center" : "left" }}>
                  {k === "best" ? "✓ " : k === "bad" ? "✕ " : ""}{cell.text}
                </Text>}
          </View>
        );
      })}
    </View>
  );
  const Block = ({ name, cells, tag }: { name: string; cells: Cell[]; tag?: string }) => (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: font.sansSemi, fontSize: 12, letterSpacing: 1.1, color: c.muted }}>
        {name.toUpperCase()}{tag ? <Text style={{ fontFamily: font.sansBold, fontSize: 11, backgroundColor: c.ink, color: c.surface }}>  {tag}  </Text> : null}
      </Text>
      <Cells cells={cells} />
    </View>
  );

  return (
    <Sheet visible={show} onClose={onClose} title={t.perbandingan} closeLabel={t.tutup}>
      {cmp && (
        <>
          <View style={{ marginTop: 14, backgroundColor: c.surface, borderWidth: 2, borderColor: c.ink, ...folder(4, 18), paddingTop: 20, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
            <View style={{ position: "absolute", left: 14, top: -14, height: 26, paddingHorizontal: 12, justifyContent: "center", backgroundColor: c.kraft, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
              <Text style={{ fontFamily: font.sansSemi, fontSize: 12, letterSpacing: 1.2, color: c.kraftInk }}>{t.putusan.toUpperCase()}</Text>
            </View>
            <RichText style={{ fontFamily: font.sans, fontSize: 15.5, lineHeight: 23, color: c.ink }}
              text={cmp.pick
                ? `${t.pilihanTerbaik(cmp.pick.k.name, cmp.pick.st.y, cmp.pick.st.n, cmp.pick.st.q)} ${cmp.pick.st.q ? t.sahkanBelumPasti : t.tetapLawat}`
                : t.semuaFlagBesar} />
            {cmp.spread != null && (
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, borderTopWidth: 1.5, borderStyle: "dotted", borderTopColor: c.line, paddingTop: 10 }}>
                <Text style={{ fontFamily: font.sans, fontSize: 14, color: c.muted }}>{t.diffLabel}</Text>
                <View style={{ flex: 1, borderBottomWidth: 2, borderStyle: "dotted", borderBottomColor: c.line, transform: [{ translateY: -4 }] }} />
                <Text style={{ fontFamily: font.mono, fontSize: 16, color: c.ink }}>{rm(cmp.spread)}+</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, columnGap: 14 }}>
            {[[`✓`, t.legBest, c.accent], [`?`, t.legUnsure, c.unk], [``, t.legNever, c.muted], [`+`, t.legPartial, c.ink]].map(([sym, txt, col], i) => (
              <Text key={i} style={{ fontFamily: font.sans, fontSize: 13, color: c.muted }}>
                {sym ? <Text style={{ fontFamily: font.monoBold, color: col }}>{sym} </Text> : <Text style={{ fontFamily: font.sansItalic }}>{t.unknown} </Text>}{txt}
              </Text>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 6 }}>
            {cmp.rows.map((r) => (
              <View key={r.k.id} style={{ flex: 1, minHeight: 92, padding: 10, gap: 6, backgroundColor: c.surface2, borderWidth: 1.5, borderColor: c.line, ...folder(4, 12) }}>
                <Text style={{ fontFamily: font.serif, fontSize: 14.5, lineHeight: 18, color: c.ink }}>{r.k.name}</Text>
                <Text style={{ fontFamily: font.sans, fontSize: 12.5, lineHeight: 16, color: r.st.major ? c.flag : c.muted }}>{r.st.major ? `✕ ${t.kritikal}` : tabLabel(r.k, t)}</Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 16 }}>
            <Block name={t.colSkor} cells={cmp.rows.map((r) => r.st.major ? { text: t.needsReview, kind: "bad" } : { text: `${r.st.y}/9`, kind: r.st.y === cmp.best.score ? "best" : "" })} />
            <Block name={t.colJarak} cells={cmp.rows.map((r) => ({ text: distLabel(r.k, r.d), kind: r.d === cmp.best.dist ? "best" : "" }))} />
            <Block name={t.colKos + (withTransport ? t.colKosTrans : "")} cells={cmp.rows.map((r) => r.annual == null ? { kind: "unk" } : { text: rmTotal(r.k, r.annual, t), kind: isBest(r.annual, cmp.best.annual) ? "best" : "" })} />
            <Block name={t.colYuran} cells={cmp.rows.map((r) => r.k.monthlyFee == null ? { kind: "unk" } : { text: rm(r.k.monthlyFee), kind: isBest(r.k.monthlyFee, cmp.best.fee) ? "best" : "" })} />
            <Block name={t.colDaftar} cells={cmp.rows.map((r) => val(r.k.registrationFee == null ? null : rm(r.k.registrationFee)))} />
            <Block name={t.colLain} cells={cmp.rows.map((r) => { const o = otherCosts(r.k); return val(o == null ? null : rm(o)); })} />
            <Block name={t.colTrans} cells={cmp.rows.map((r) => val(r.k.monthlyTransportCost == null ? null : rm(r.k.monthlyTransportCost)))} />
            <Block name={t.colNisbah} cells={cmp.rows.map((r) => r.k.teacherStudentRatio == null ? { kind: "unk" } : { text: ratioLabel(r.k, t), kind: statusOf(r.k, "ratio", ov[r.k.id]) === "flag" ? "bad" : isBest(r.k.teacherStudentRatio, cmp.best.ratio) ? "best" : "" })} />
            <Block name={t.colKurikulum} cells={cmp.rows.map((r) => r.k.curriculumCode === "none_stated" ? { kind: "unk" } : { text: currLabel(r.k.curriculumCode, t), kind: "txt" })} />
            <Block name={t.colWaktu} cells={cmp.rows.map((r) => val(r.k.hoursOpen ? hoursLabel(r.k, lang, t) : null))} />
          </View>

          <Text accessibilityRole="header" style={{ fontFamily: font.serif, fontSize: 20, color: c.ink }}>{t.failSemakan}</Text>
          <View style={{ gap: 16 }}>
            {CRITERIA.map((cr, i) => (
              <Block key={cr.k} name={`${i + 1}. ${cr[lang].t}`} tag={cr.major ? t.criticalTag : undefined}
                cells={cmp.rows.map((r) => { const v = statusOf(r.k, cr.k, ov[r.k.id]); return { text: label[v], kind: v }; })} />
            ))}
            <Block name={t.colNota} cells={cmp.rows.map((r) => ov[r.k.id]?.note ? { text: ov[r.k.id]!.note, kind: "txt" } : { text: t.notaKosong, kind: "unk" })} />
          </View>
        </>
      )}
    </Sheet>
  );
}
