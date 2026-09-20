import { Pressable, Text, View } from "react-native";
import { CRITERIA } from "@/content/criteria";
import type { Dict } from "@/content/i18n";
import { rmTotal } from "@/lib/cost";
import { fmtKm } from "@/lib/geo";
import { ratioLabel, tabLabel } from "@/lib/format";
import { statusOf } from "@/lib/scoring";
import type { Row } from "@/lib/filter";
import type { Lang, Override, Status } from "@/lib/types";
import { folder, font, useColors } from "./theme";
import { Btn, Icon, ICONS, Stamp, tap, Unk } from "./ui";

export function Card({ row, annual, lang, t, ov, compared, onOpen, onToggleCompare }: {
  row: Row; annual: number | null; lang: Lang; t: Dict; ov?: Override; compared: boolean;
  onOpen: () => void; onToggleCompare: () => void;
}) {
  const c = useColors();
  const { k, d, st } = row;
  const hasMine = !!ov?.statuses && Object.keys(ov.statuses).length > 0;
  const statuses = CRITERIA.map((cr) => statusOf(k, cr.k, ov));
  const stripAria = `${t.skorLbl}: ${statuses.filter((s) => s === "ok").length} ${t.statusY}, ${statuses.filter((s) => s === "flag").length} ${t.statusN}, ${statuses.filter((s) => s === "unsure").length} ${t.statusQ}`;

  const Chip = ({ text, fg, bg, line }: { text: string; fg: string; bg: string; line?: string }) => (
    <View style={{ minHeight: 30, justifyContent: "center", paddingHorizontal: 10, borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomRightRadius: 15, borderBottomLeftRadius: 4,
      backgroundColor: bg, borderWidth: 1.5, borderColor: line ?? "transparent" }}>
      <Text style={{ fontFamily: font.sansSemi, fontSize: 13, color: fg }}>{text}</Text>
    </View>
  );
  const Field = ({ label, value, mono = true }: { label: string; value: string | null; mono?: boolean }) => (
    <View style={{ width: "47.5%" }}>
      <Text style={{ fontFamily: font.sansSemi, fontSize: 12, letterSpacing: 1.1, color: c.muted, marginBottom: 6 }}>{label.toUpperCase()}</Text>
      <View style={{ paddingBottom: 4, borderBottomWidth: 1.5, borderStyle: value ? "dotted" : "dashed", borderBottomColor: c.line }}>
        {value ? <Text style={{ fontFamily: mono ? font.monoMed : font.sansMed, fontSize: 15, color: c.ink }}>{value}</Text> : <Unk t={t} />}
      </View>
    </View>
  );
  const box = (s: Status, i: number) => {
    const crit = CRITERIA[i].major;
    const m = { ok: { bg: c.accentSoft, fg: c.accent, bd: c.accent, sym: "✓", st: "solid" }, flag: { bg: c.flagBg, fg: c.flag, bd: c.flag, sym: "✕", st: "solid" }, unsure: { bg: "transparent", fg: c.unk, bd: c.line, sym: "?", st: "dashed" } }[s];
    return (
      <View key={i} style={{ width: 27, height: 27, alignItems: "center", justifyContent: "center", borderRadius: 3, borderWidth: 1.5, borderBottomWidth: crit ? 4 : 1.5,
        borderStyle: m.st as "solid" | "dashed", backgroundColor: m.bg, borderColor: m.bd }}>
        <Text style={{ fontFamily: font.mono, fontSize: 13, color: m.fg }}>{m.sym}</Text>
      </View>
    );
  };

  return (
    <View style={{ marginTop: 28, backgroundColor: c.surface, ...folder(4, 18), borderWidth: 1.5, borderColor: st.major ? c.flag : c.line, padding: 16, gap: 12,
      shadowColor: "#1B2A26", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}>
      <View style={{ position: "absolute", top: -26, left: 14, height: 26, paddingHorizontal: 12, justifyContent: "center", backgroundColor: c.kraft, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
        <Text style={{ fontFamily: font.sansSemi, fontSize: 12, letterSpacing: 1.2, color: c.kraftInk }}>{tabLabel(k, t)}</Text>
      </View>
      {st.major && (
        <View style={{ position: "absolute", top: -26, right: 18, height: 34, paddingHorizontal: 12, paddingBottom: 6, justifyContent: "center", backgroundColor: c.ribbon,
          borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }}>
          <Text style={{ fontFamily: font.sansBold, fontSize: 12, letterSpacing: 1, color: "#FFFFFF" }}>{t.flaggedRibbon}</Text>
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
        <Text accessibilityRole="header" style={{ flex: 1, paddingTop: 4, fontFamily: font.serif, fontSize: 20, lineHeight: 24, color: c.ink }}>{k.name}</Text>
        <Stamp st={st} t={t} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 }}>
        <Field label={t.kawasan} value={k.area || null} mono={false} />
        <Field label={t.jarak} value={fmtKm(d)} />
        <Field label={t.kosTahun} value={annual == null ? null : rmTotal(k, annual, t)} />
        <Field label={t.nisbah} value={k.teacherStudentRatio == null ? null : ratioLabel(k, t)} />
      </View>
      <View accessible accessibilityRole="image" accessibilityLabel={stripAria} style={{ flexDirection: "row", gap: 4 }}>{statuses.map(box)}</View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {CRITERIA.map((cr) => statusOf(k, cr.k, ov) === "flag" && <Chip key={cr.k} text={`✕ ${cr[lang].short}`} fg={c.flag} bg={c.flagBg} line={c.flag} />)}
        {st.q > 0 && <Chip text={t.belumSemak(st.q)} fg={c.unk} bg={c.unkBg} />}
        {!st.n && !st.q && <Chip text={t.noFlag} fg={c.accent} bg={c.accentSoft} />}
        {hasMine && <Chip text={t.adaSemakan} fg={c.muted} bg={c.surface2} line={c.line} />}
      </View>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "stretch" }}>
        <Btn primary label={t.bukaFail} onPress={onOpen} style={{ flex: 1 }} icon={<Icon d={ICONS.arrow} size={16} color={c.surface} sw={2.2} />} />
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: compared }} accessibilityLabel={`${t.banding} ${k.name}`} onPress={() => { tap(); onToggleCompare(); }}
          style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, ...folder(4, 12), borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface2 }}>
          <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: compared ? c.accent : c.ink, backgroundColor: compared ? c.accent : "transparent", alignItems: "center", justifyContent: "center" }}>
            {compared && <Text style={{ color: c.accentInk, fontSize: 13, lineHeight: 15 }}>✓</Text>}
          </View>
          <Text style={{ fontFamily: font.sansSemi, fontSize: 14, color: c.ink }}>{t.banding}</Text>
        </Pressable>
      </View>
    </View>
  );
}
