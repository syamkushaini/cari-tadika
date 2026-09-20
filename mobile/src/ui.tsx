import * as Haptics from "expo-haptics";
import { Modal, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Dict } from "@/content/i18n";
import { stampIsPass, tone, type Stats } from "@/lib/scoring";
import { folder, font, useColors } from "./theme";

export const tap = () => { Haptics.selectionAsync().catch(() => {}); };

export function Btn({ label, onPress, primary, disabled, small, style, icon }: {
  label: string; onPress: () => void; primary?: boolean; disabled?: boolean; small?: boolean; style?: StyleProp<ViewStyle>; icon?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [{
        minHeight: 44, paddingHorizontal: small ? 13 : 16, ...folder(4, 12), borderWidth: 1.5, borderColor: c.ink,
        backgroundColor: primary ? c.ink : "transparent", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
        opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
      }, style]}>
      {icon}
      <Text style={{ fontFamily: font.sansSemi, fontSize: 15, color: primary ? c.surface : c.ink }}>{label}</Text>
    </Pressable>
  );
}

/** Underlined text link-button (the design's ".btn.txt"). */
export function TextBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" onPress={() => { tap(); onPress(); }} style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
      <Text style={{ fontFamily: font.sansSemi, fontSize: 15, color: c.ink, textDecorationLine: "underline" }}>{label}</Text>
    </Pressable>
  );
}

/** Equal-width single-choice row (radio semantics), e.g. distance 3 | 5 | 10 | 25 | All. */
export function Seg<T extends string | number>({ label, value, options, onChange, mono }: {
  label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; mono?: boolean;
}) {
  const c = useColors();
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ fontFamily: font.sansSemi, fontSize: 12, letterSpacing: 1.1, color: c.muted }}>{label.toUpperCase()}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: "row", gap: 6 }}>
        {options.map((o) => {
          const on = o.v === value;
          return (
            <Pressable key={String(o.v)} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { tap(); onChange(o.v); }}
              style={{ flex: 1, minHeight: 44, paddingHorizontal: 2, alignItems: "center", justifyContent: "center", ...folder(4, 12), borderWidth: 1.5,
                borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : c.surface }}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: on ? (mono ? font.monoBold : font.sansSemi) : (mono ? font.monoMed : font.sansMed), fontSize: 14, textAlign: "center", color: on ? c.surface : c.ink }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Switch row with ON/OFF text so state never relies on colour alone. */
export function SwitchRow({ label, sub, tag, on, onPress, onText, offText, last }: {
  label: string; sub?: string; tag?: string; on: boolean; onPress: () => void; onText: string; offText: string; last?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} onPress={() => { tap(); onPress(); }}
      style={{ minHeight: 52, paddingVertical: 8, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: last ? 0 : 1, borderStyle: "dotted", borderBottomColor: c.line }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font.sansMed, fontSize: 15, color: c.ink }}>
          {label}{tag ? <Text style={{ fontFamily: font.sansSemi, fontSize: 11.5, color: c.unk, backgroundColor: c.unkBg }}>  {tag}  </Text> : null}
        </Text>
        {sub ? <Text style={{ fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: c.muted, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <Text style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: 0.7, color: c.muted, width: 26, textAlign: "right" }}>{on ? onText : offText}</Text>
      <View style={{ width: 48, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : c.surface2, justifyContent: "center" }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, marginLeft: on ? 22 : 2, backgroundColor: on ? c.surface : c.muted }} />
      </View>
    </Pressable>
  );
}

export function Stamp({ st, t, size = 72 }: { st: Stats; t: Dict; size?: number }) {
  const c = useColors();
  const col = { flag: c.flag, unk: c.unk, accent: c.accent }[tone(st)];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t.stampAria(st.y, st.major)}
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2.5, borderStyle: "dashed", borderColor: col,
        alignItems: "center", justifyContent: "center", transform: [{ rotate: "-7deg" }], backgroundColor: c.surface }}>
      <View pointerEvents="none" style={{ position: "absolute", top: 3, left: 3, right: 3, bottom: 3, borderRadius: size, borderWidth: 1, borderColor: col }} />
      <Text style={{ fontFamily: font.mono, fontSize: 20, color: col }}>{st.y}/9</Text>
      <Text style={{ fontFamily: font.sansBold, fontSize: 11, letterSpacing: 1.5, marginTop: 4, color: col }}>
        {stampIsPass(st) ? t.stampLulus : t.stampSemak}
      </Text>
    </View>
  );
}

/** Italic "Not yet known" text, used wherever a value is missing. */
export function Unk({ t, size = 13.5 }: { t: Dict; size?: number }) {
  const c = useColors();
  return <Text style={{ fontFamily: font.sansItalic, fontSize: size, color: c.muted }}>{t.unknown}</Text>;
}

export function Icon({ d, size = 18, color, sw = 2 }: { d: string; size?: number; color: string; sw?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
export const ICONS = {
  arrow: "M5 12h14M13 6l6 6-6 6", chevron: "m9 6 6 6-6 6", down: "m6 9 6 6 6-6", close: "m6 6 12 12M18 6 6 18",
  warn: "M12 3 2.5 20h19L12 3ZM12 10v4.5M12 17.2v.1", info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 11v5M12 7.8v.1",
  err: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9 9l6 6M15 9l-6 6", search: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM16 16l4 4",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11ZM12 7.7a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z",
  locate: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 4.8a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM9 14.8a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z",
  ext: "M7 17 17 7M9 7h8v8",
} as const;

/** Renders `<b>…</b>` from the i18n verdict strings as bold text (no HTML on native). */
export function RichText({ text, style }: { text: string; style?: object }) {
  const parts = text.split(/(<b>.*?<\/b>)/g).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((p, i) => p.startsWith("<b>")
        ? <Text key={i} style={{ fontFamily: font.serifBold, fontSize: 17 }}>{p.slice(3, -4)}</Text>
        : p)}
    </Text>
  );
}

export function Sheet({ visible, onClose, title, closeLabel, children, footer }: {
  visible: boolean; onClose: () => void; title: string; closeLabel: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 16, paddingRight: 8, paddingTop: 14, gap: 12 }}>
          <Text accessibilityRole="header" style={{ flex: 1, fontFamily: font.serifBold, fontSize: 26, color: c.ink }} numberOfLines={2}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} hitSlop={6}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <Icon d={ICONS.close} size={22} color={c.ink} sw={2.4} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          {children}
        </ScrollView>
        {footer}
      </View>
    </Modal>
  );
}
