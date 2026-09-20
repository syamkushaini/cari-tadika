import * as Haptics from "expo-haptics";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import { CRITERIA } from "@/content/criteria";
import type { Dict } from "@/content/i18n";
import { annualCost, costLines, isPartialCost, rm, rmOr } from "@/lib/cost";
import { currLabel, hoursLabel, ratioFull, typeLabel } from "@/lib/format";
import { fmtKm, km, type LatLng } from "@/lib/geo";
import { stats, statusOf } from "@/lib/scoring";
import type { Kindergarten, Lang, Override, Status } from "@/lib/types";
import { font, useColors } from "./theme";
import { Btn, Sheet, tap } from "./ui";

const STATUSES: Status[] = ["ok", "flag", "unsure"];

export function DetailSheet({ k, lang, t, loc, ov, withTransport, compared, onClose, onSetStatus, onSetNote, onReset, onToggleCompare }: {
  k: Kindergarten | null; lang: Lang; t: Dict; loc: LatLng; ov?: Override; withTransport: boolean; compared: boolean;
  onClose: () => void; onSetStatus: (k: Kindergarten, key: string, v: Status) => void;
  onSetNote: (id: string, note: string) => void; onReset: (id: string) => void; onToggleCompare: (id: string) => void;
}) {
  const c = useColors();
  const label: Record<Status, string> = { ok: t.statusY, flag: t.statusN, unsure: t.statusQ };
  const colorOf = (s: Status) => ({ ok: c.accent, flag: c.flag, unsure: c.unk })[s];
  const st = k ? stats(k, ov) : null;
  const annual = k ? annualCost(k, withTransport) : 0;
  const Title = ({ a, b }: { a: string; b?: string }) => (
    <View style={{ gap: 2 }}>
      <Text accessibilityRole="header" style={{ fontFamily: font.serif, fontSize: 17, color: c.ink }}>{a}</Text>
      {b ? <Text style={{ fontFamily: font.sans, fontSize: 12, color: c.muted }}>{b}</Text> : null}
    </View>
  );

  return (
    <Sheet visible={!!k} onClose={onClose} title={k?.name ?? ""} closeLabel={t.tutup}>
      {k && st && (
        <>
          <Text style={{ fontFamily: font.sans, fontSize: 14, color: c.muted, marginTop: -8 }}>
            {k.area ? `${k.area} · ` : ""}{typeLabel(k, t)} · <Text style={{ fontFamily: font.mono, color: c.ink }}>{fmtKm(km(loc, k))}</Text> {t.dariAnda}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: c.line, borderRadius: 6, overflow: "hidden" }}>
            {[
              [t.skorLbl, `${st.y}/9 ${t.lulus}${st.major ? ` · ${t.kritikal}` : ""}`],
              [t.yuran, k.monthlyFee == null ? t.unknown : `${rm(k.monthlyFee)} ${t.perBulan}`],
              [t.kosSetahun, rmOr(annual, t)],
              [t.nisbah, ratioFull(k, t)],
              [t.kurikulum, currLabel(k.curriculumCode, t)],
              [t.waktu, hoursLabel(k, lang, t)],
            ].map(([l, v]) => (
              <View key={l} style={{ width: "50%", padding: 10, borderWidth: 0.5, borderColor: c.line }}>
                <Text style={{ fontFamily: font.sansSemi, fontSize: 11, color: c.muted }}>{l}</Text>
                <Text style={{ fontFamily: font.mono, fontSize: 13.5, color: c.ink }}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {k.phone && <Btn small label={`${t.call} · ${k.phone}`} onPress={() => Linking.openURL(`tel:${k.phone!.replace(/[^+\d]/g, "")}`)} />}
            <Btn small label={t.googleMaps} onPress={() => Linking.openURL(`http://maps.apple.com/?ll=${k.lat},${k.lng}&q=${encodeURIComponent(k.name)}`)} />
            <Btn small label={t.eprasekolah} onPress={() => Linking.openURL("https://eprasekolah.moe.gov.my/")} />
          </View>

          <Title a={t.anggaranKos} b={withTransport ? t.termasukTrans : t.tanpaTrans} />
          <View style={{ borderTopWidth: 2, borderTopColor: c.ink }}>
            {costLines(k, withTransport, t).map((l) => (
              <View key={l.label} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderStyle: "dotted", borderBottomColor: c.line, opacity: l.off ? 0.5 : 1 }}>
                <Text style={{ flex: 1, fontFamily: font.sans, fontSize: 13.5, color: c.muted }}>{l.label}</Text>
                <Text style={{ fontFamily: font.mono, fontSize: 13.5, color: c.ink }}>{l.off ? "–" : rmOr(l.value, t)}</Text>
              </View>
            ))}
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1.5, borderTopColor: c.ink, marginTop: 2 }}>
              <Text style={{ fontFamily: font.serif, fontSize: 15, color: c.ink }}>{t.jumlahSetahun}</Text>
              <Text style={{ fontFamily: font.monoBold, fontSize: 16, color: c.ink }}>{rmOr(annual, t)}</Text>
            </View>
          </View>
          <Text style={{ fontFamily: font.sans, fontSize: 12, color: c.muted, marginTop: -8 }}>{annual == null ? t.noVerdictData : t.purataSebulan(rm(annual / k.billableMonths))}{isPartialCost(k) ? ` ${t.costPartial}` : ""}</Text>

          <Title a={t.failSemakan} b={t.tekanKemaskini} />
          <View style={{ gap: 9 }}>
            {CRITERIA.map((cr, i) => {
              const v = statusOf(k, cr.k, ov);
              const mine = !!ov?.statuses?.[cr.k];
              return (
                <View key={cr.k} style={{ borderWidth: 1, borderColor: c.line, borderLeftWidth: 4, borderLeftColor: colorOf(v), borderRadius: 8, padding: 12, gap: 8 }}>
                  <Text style={{ fontFamily: font.sansSemi, fontSize: 14.5, color: c.ink }}>
                    {i + 1}. {cr[lang].t}{cr.major ? <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: c.flag }}>  {t.criticalTag}</Text> : null}
                  </Text>
                  <View accessibilityRole="radiogroup" style={{ flexDirection: "row", borderWidth: 1.5, borderColor: c.ink, borderRadius: 6, overflow: "hidden" }}>
                    {STATUSES.map((o, j) => {
                      const on = v === o;
                      return (
                        <Pressable key={o} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${cr[lang].t}: ${label[o]}`}
                          onPress={() => { Haptics.selectionAsync().catch(() => {}); onSetStatus(k, cr.k, o); }}
                          style={{ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderLeftWidth: j ? 1.5 : 0, borderLeftColor: c.ink, backgroundColor: on ? colorOf(o) : "transparent" }}>
                          <Text style={{ fontFamily: font.monoBold, fontSize: 12, color: on ? (o === "ok" ? c.accentInk : c.surface) : c.muted }}>{label[o]}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={{ fontFamily: font.sans, fontSize: 13, color: c.muted }}>{cr[lang].tip}</Text>
                  <Text style={{ fontFamily: font.mono, fontSize: 11, color: c.muted }}>
                    {mine ? t.semakanAnda : t.dataAsal}{cr.k === "ratio" && k.teacherStudentRatio != null ? ` · ${t.ratioWord} 1:${k.teacherStudentRatio}` : ""}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: font.sansSemi, fontSize: 12, color: c.muted }}>{t.notaLawatan}</Text>
            <TextInput multiline value={ov?.note ?? ""} onChangeText={(s) => onSetNote(k.id, s)} placeholder={t.notaPlaceholder} placeholderTextColor={c.muted}
              style={{ minHeight: 120, borderWidth: 1.5, borderColor: c.line, borderRadius: 6, padding: 12, fontFamily: font.sans, fontSize: 16, lineHeight: 24, color: c.ink, textAlignVertical: "top" }} />
          </View>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Btn small label={t.setSemula} onPress={() => onReset(k.id)} />
            <Btn small primary={compared} label={compared ? `✓ ${t.tambahBanding}` : t.tambahBanding} onPress={() => { tap(); onToggleCompare(k.id); }} />
          </View>
        </>
      )}
    </Sheet>
  );
}
