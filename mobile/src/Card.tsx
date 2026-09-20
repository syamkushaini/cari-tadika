import { Pressable, Text, View } from "react-native";
import { CRITERIA } from "@/content/criteria";
import type { Dict } from "@/content/i18n";
import { rmOr } from "@/lib/cost";
import { fmtKm } from "@/lib/geo";
import { ratioLabel, tagTypeLabel } from "@/lib/format";
import { statusOf } from "@/lib/scoring";
import type { Row } from "@/lib/filter";
import type { Lang, Override } from "@/lib/types";
import { font, useColors } from "./theme";
import { Btn, Stamp, tap } from "./ui";

export function Card({ row, annual, lang, t, ov, compared, onOpen, onToggleCompare }: {
  row: Row; annual: number | null; lang: Lang; t: Dict; ov?: Override; compared: boolean;
  onOpen: () => void; onToggleCompare: () => void;
}) {
  const c = useColors();
  const { k, d, st } = row;
  const hasMine = !!ov?.statuses && Object.keys(ov.statuses).length > 0;
  const Tag = ({ text, fg, bg }: { text: string; fg: string; bg: string }) => (
    <View style={{ backgroundColor: bg, borderColor: fg, borderWidth: 1, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontFamily: font.sansSemi, fontSize: 12, color: fg }}>{text}</Text>
    </View>
  );
  return (
    <View style={{ marginTop: 10, backgroundColor: c.surface, borderRadius: 12, borderTopLeftRadius: 3, borderBottomLeftRadius: 3,
      borderWidth: 1, borderColor: st.major ? c.flag : c.line, padding: 16, flexDirection: "row", gap: 14,
      shadowColor: "#141E1B", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
      <View style={{ position: "absolute", top: -10, left: 16, backgroundColor: c.kraft, borderRadius: 3, paddingHorizontal: 9, paddingVertical: 3 }}>
        <Text style={{ fontFamily: font.sansBold, fontSize: 10, letterSpacing: 0.4, color: c.kraftInk }}>{tagTypeLabel(k, t)}</Text>
      </View>
      {st.major && (
        <View style={{ position: "absolute", top: 14, right: -1, backgroundColor: c.flag, borderTopLeftRadius: 5, borderBottomLeftRadius: 5, paddingLeft: 12, paddingRight: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: font.sansBold, fontSize: 9.5, letterSpacing: 0.4, color: c.surface }}>{t.flaggedRibbon}</Text>
        </View>
      )}
      <View style={{ paddingTop: 8 }}><Stamp st={st} t={t} /></View>
      <View style={{ flex: 1, gap: 10 }}>
        <Text accessibilityRole="header" style={{ fontFamily: font.serif, fontSize: 20, color: c.ink, paddingRight: st.major ? 70 : 0 }}>{k.name}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, columnGap: 16 }}>
          {[[t.kawasan, k.area], [t.jarak, fmtKm(d)], [t.kosTahun, rmOr(annual, t)], [t.nisbah, ratioLabel(k, t)]].map(([l, v]) => (
            <View key={l}>
              <Text style={{ fontFamily: font.sansSemi, fontSize: 10.5, color: c.muted }}>{l}</Text>
              <Text style={{ fontFamily: font.mono, fontSize: 13.5, color: c.ink }}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {CRITERIA.map((cr) => statusOf(k, cr.k, ov) === "flag" && <Tag key={cr.k} text={`✕ ${cr[lang].short}`} fg={c.flag} bg={c.flagBg} />)}
          {st.q > 0 && <Tag text={t.belumSemak(st.q)} fg={c.unk} bg={c.unkBg} />}
          {!st.n && !st.q && <Tag text={t.noFlag} fg={c.accent} bg={c.accentSoft} />}
          {hasMine && <Tag text={t.adaSemakan} fg={c.muted} bg={c.surface2} />}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Btn primary small label={t.bukaFail} onPress={onOpen} />
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: compared }} onPress={() => { tap(); onToggleCompare(); }}
            style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7 }}>
            <View style={{ width: 20, height: 20, borderRadius: 3, borderWidth: 1.5, borderColor: compared ? c.accent : c.ink, backgroundColor: compared ? c.accent : "transparent", alignItems: "center", justifyContent: "center" }}>
              {compared && <Text style={{ color: c.accentInk, fontSize: 12, lineHeight: 14 }}>✓</Text>}
            </View>
            <Text style={{ fontFamily: font.sansSemi, fontSize: 14, color: c.muted }}>{t.banding}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
