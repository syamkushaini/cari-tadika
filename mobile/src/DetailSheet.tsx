import * as Haptics from "expo-haptics";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import { CRITERIA } from "@/content/criteria";
import type { Dict } from "@/content/i18n";
import { annualCost, costLines, isPartialCost, rm, rmTotal } from "@/lib/cost";
import { currLabel, distLabel, hoursLabel, ratioLabel, tabLabel } from "@/lib/format";
import { km, type LatLng } from "@/lib/geo";
import { stats, statusOf } from "@/lib/scoring";
import type { Kindergarten, Lang, Override, Status } from "@/lib/types";
import { folder, font, useColors } from "./theme";
import { Btn, Icon, ICONS, Sheet, tap, Unk } from "./ui";

const STATUSES: Status[] = ["ok", "flag", "unsure"];

export function DetailSheet({ k, lang, t, loc, ov, withTransport, compared, onClose, onSetStatus, onSetNote, onReset, onToggleCompare }: {
  k: Kindergarten | null; lang: Lang; t: Dict; loc: LatLng; ov?: Override; withTransport: boolean; compared: boolean;
  onClose: () => void; onSetStatus: (k: Kindergarten, key: string, v: Status) => void;
  onSetNote: (id: string, note: string) => void; onReset: (id: string) => void; onToggleCompare: (id: string) => void;
}) {
  const c = useColors();
  const label: Record<Status, string> = { ok: `✓ ${t.statusY}`, flag: `✕ ${t.statusN}`, unsure: `? ${t.statusQ}` };
  const colorOf = (s: Status) => ({ ok: c.accent, flag: c.flag, unsure: c.unk })[s];
  const st = k ? stats(k, ov) : null;
  const annual = k ? annualCost(k, withTransport) : null;
  const H3 = ({ children }: { children: string }) => <Text accessibilityRole="header" style={{ fontFamily: font.serif, fontSize: 20, color: c.ink }}>{children}</Text>;
  const Lab = ({ children }: { children: string }) => <Text style={{ fontFamily: font.sansSemi, fontSize: 12, letterSpacing: 1.1, color: c.muted }}>{children.toUpperCase()}</Text>;
  const Fact = ({ l, v, mono = true, i }: { l: string; v: string | null; mono?: boolean; i: number }) => (
    <View style={{ width: "50%", padding: 12, borderBottomWidth: i < 4 ? 1 : 0, borderStyle: "dotted", borderBottomColor: c.line, borderRightWidth: i % 2 === 0 ? 1 : 0, borderRightColor: c.line }}>
      <Lab>{l}</Lab>
      <View style={{ marginTop: 8 }}>{v ? <Text style={{ fontFamily: mono ? font.monoMed : font.sansMed, fontSize: mono ? 17 : 16, color: c.ink }}>{v}</Text> : <Unk t={t} />}</View>
    </View>
  );
  const Leader = ({ l, note, v, unknown, total, muted }: { l: string; note?: string; v: string; unknown?: boolean; total?: boolean; muted?: boolean }) => (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, ...(total ? { borderTopWidth: 2, borderTopColor: c.ink, paddingTop: 12, marginTop: 4 } : {}) }}>
      <Text style={{ flexShrink: 1, fontFamily: total ? font.sansSemi : font.sans, fontSize: 15, color: muted ? c.muted : c.ink }}>
        {l}{note ? <Text style={{ fontSize: 13, color: c.muted }}>  {note}</Text> : null}
      </Text>
      <View style={{ flex: 1, minWidth: 12, borderBottomWidth: 2, borderStyle: "dotted", borderBottomColor: c.line, transform: [{ translateY: -4 }] }} />
      {unknown ? <Unk t={t} /> : <Text style={{ fontFamily: total ? font.mono : font.monoMed, fontSize: total ? 19 : 15, color: c.ink }}>{v}</Text>}
    </View>
  );

  return (
    <Sheet visible={!!k} onClose={onClose} title={k?.name ?? ""} closeLabel={t.tutup}>
      {k && st && (
        <>
          <View style={{ gap: 8, marginTop: -8 }}>
            <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, backgroundColor: c.kraft, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
              <Text style={{ fontFamily: font.sansSemi, fontSize: 12, letterSpacing: 1.1, color: c.kraftInk }}>{tabLabel(k, t)}</Text>
            </View>
            <Text style={{ fontFamily: font.sans, fontSize: 14, color: c.muted }}>
              {k.area ? `${k.area} · ` : ""}<Text style={{ fontFamily: font.mono, color: c.ink }}>{distLabel(k, km(loc, k))}</Text> {t.dariAnda}
            </Text>
            {k.institutionCode ? <Text style={{ fontFamily: font.sans, fontSize: 13, color: c.muted }}>{t.instCode}: <Text style={{ fontFamily: font.mono, color: c.ink }}>{k.institutionCode}</Text>{k.vacancies != null ? <Text>  ·  {t.vacanciesLbl}: <Text style={{ fontFamily: font.mono, color: c.ink }}>{k.vacancies}</Text></Text> : null}</Text> : null}
            {k.locationApprox ? <Text style={{ fontFamily: font.sansItalic, fontSize: 13, color: c.muted }}>{t.approxNote}</Text> : null}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.line, ...folder(4, 16), overflow: "hidden" }}>
            <Fact i={0} l={t.skorLbl} v={`${st.y}/9`} />
            <Fact i={1} l={t.yuran} v={k.monthlyFee == null ? null : rm(k.monthlyFee)} />
            <Fact i={2} l={t.kosSetahun} v={annual == null ? null : rmTotal(k, annual, t)} />
            <Fact i={3} l={t.nisbah} v={k.teacherStudentRatio == null ? null : ratioLabel(k, t)} />
            <Fact i={4} l={t.kurikulum} v={currLabel(k.curriculumCode, t)} mono={false} />
            <Fact i={5} l={t.waktu} v={k.hoursOpen ? hoursLabel(k, lang, t) : null} />
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {k.phone && <Btn label={t.call} onPress={() => Linking.openURL(`tel:${k.phone!.replace(/[^+\d]/g, "")}`)} style={{ flex: 1 }} icon={<Icon d={ICONS.phone} color={c.ink} sw={1.8} />} />}
              <Btn label={t.googleMaps} onPress={() => Linking.openURL(`http://maps.apple.com/?ll=${k.lat},${k.lng}&q=${encodeURIComponent(k.name)}`)} style={{ flex: 1 }} icon={<Icon d={ICONS.pin} color={c.ink} sw={1.8} />} />
            </View>
            <Btn label={t.eprasekolah} onPress={() => Linking.openURL("https://eprasekolah.moe.gov.my/")} icon={<Icon d={ICONS.ext} size={16} color={c.ink} sw={2.2} />} />
          </View>

          <View style={{ gap: 12 }}>
            <H3>{t.anggaranKos}</H3>
            <View style={{ backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.line, ...folder(4, 16), padding: 16, gap: 10 }}>
              {costLines(k, withTransport, t).map((l) => (
                <Leader key={l.label} l={l.label} v={l.off ? "–" : l.value == null ? "" : rm(l.value)} unknown={!l.off && l.value == null} />
              ))}
              <Leader total l={t.jumlahSetahun} v={rmTotal(k, annual, t)} unknown={annual == null} />
              {annual != null && <Leader muted l={t.avgLabel} v={rm(annual / k.billableMonths) + (isPartialCost(k) ? "+" : "")} />}
              {(isPartialCost(k) || annual == null) && (
                <View accessibilityRole="alert" style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: c.unkBg, ...folder(4, 12), padding: 12 }}>
                  <Icon d={ICONS.warn} color={c.unk} />
                  <Text style={{ flex: 1, fontFamily: font.sansMed, fontSize: 13.5, lineHeight: 19, color: c.unk }}>{annual == null ? t.noVerdictData : t.costPartial}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <H3>{t.failSemakan}</H3>
              <Text style={{ fontFamily: font.sans, fontSize: 14, lineHeight: 20, color: c.muted }}>{t.ckIntro}</Text>
            </View>
            {CRITERIA.map((cr, i) => {
              const v = statusOf(k, cr.k, ov);
              const mine = !!ov?.statuses?.[cr.k];
              return (
                <View key={cr.k} style={{ backgroundColor: c.surface, ...folder(4, 16), borderWidth: 1.5, borderColor: v === "flag" ? c.flag : c.line, borderLeftWidth: 7, borderLeftColor: colorOf(v), padding: 14, gap: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: c.ink, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontFamily: font.mono, fontSize: 13, color: c.ink }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, fontFamily: font.serif, fontSize: 16, lineHeight: 20, color: c.ink }}>{cr[lang].t}</Text>
                    {cr.major && <View style={{ backgroundColor: c.ink, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3 }}><Text style={{ fontFamily: font.sansBold, fontSize: 11, letterSpacing: 1.1, color: c.surface }}>{t.criticalTag}</Text></View>}
                  </View>
                  <View accessibilityRole="radiogroup" accessibilityLabel={cr[lang].t} style={{ flexDirection: "row", borderWidth: 1.5, borderColor: c.line, ...folder(4, 12), overflow: "hidden", backgroundColor: c.surface2 }}>
                    {STATUSES.map((o, j) => {
                      const on = v === o;
                      const bg = on ? { ok: c.accent, flag: c.flag, unsure: c.unkBg }[o] : "transparent";
                      const fg = on ? { ok: c.accentInk, flag: c.flagInk, unsure: c.unk }[o] : c.ink;
                      return (
                        <Pressable key={o} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${cr[lang].t}: ${label[o]}`}
                          onPress={() => { Haptics.selectionAsync().catch(() => {}); onSetStatus(k, cr.k, o); }}
                          style={{ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderLeftWidth: j ? 1 : 0, borderLeftColor: c.line, backgroundColor: bg,
                            ...(on && o === "unsure" ? { borderWidth: 2, borderColor: c.unk } : {}) }}>
                          <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: on ? font.sansSemi : font.sansMed, fontSize: 13.5, color: fg, paddingHorizontal: 2 }}>{label[o]}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={{ fontFamily: font.sans, fontSize: 14, lineHeight: 20, color: c.muted }}>{cr[lang].tip}</Text>
                  <Text style={{ fontFamily: font.sansMed, fontSize: 12.5, color: c.muted }}>
                    {t.srcLabel} {mine ? t.semakanAnda : t.dataAsal}{cr.k === "ratio" && k.teacherStudentRatio != null ? ` · ${t.ratioWord} 1:${k.teacherStudentRatio}` : ""}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={{ gap: 8 }}>
            <H3>{t.notaLawatan}</H3>
            <TextInput multiline value={ov?.note ?? ""} onChangeText={(s) => onSetNote(k.id, s)} placeholder={t.notaPlaceholder} placeholderTextColor={c.muted} accessibilityLabel={t.notaLawatan}
              style={{ minHeight: 150, borderWidth: 1.5, borderColor: c.line, ...folder(4, 16), backgroundColor: c.surface, padding: 14, fontFamily: font.sans, fontSize: 16, lineHeight: 32, color: c.ink, textAlignVertical: "top" }} />
          </View>
          <View style={{ gap: 8 }}>
            <Btn primary label={compared ? `✓ ${t.tambahBanding}` : t.tambahBanding} onPress={() => { tap(); onToggleCompare(k.id); }} />
            <Btn label={t.setSemula} onPress={() => onReset(k.id)} />
          </View>
        </>
      )}
    </Sheet>
  );
}
