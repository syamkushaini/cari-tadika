import * as Haptics from "expo-haptics";
import { Modal, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from "react-native";
import type { Dict } from "@/content/i18n";
import { stampIsPass, tone, type Stats } from "@/lib/scoring";
import { font, useColors } from "./theme";

export const tap = () => { Haptics.selectionAsync().catch(() => {}); };

export function Btn({ label, onPress, primary, disabled, small, style }: {
  label: string; onPress: () => void; primary?: boolean; disabled?: boolean; small?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [{
        minHeight: 44, paddingHorizontal: small ? 13 : 16, borderRadius: 6, borderWidth: 1.5, borderColor: c.ink,
        backgroundColor: primary ? c.ink : "transparent", alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      }, style]}>
      <Text style={{ fontFamily: font.sansSemi, fontSize: 14, color: primary ? c.surface : c.ink }}>{label}</Text>
    </Pressable>
  );
}

/** Pill toggle (checkbox semantics). */
export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => { tap(); onPress(); }}
      style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1.5, borderColor: on ? c.accent : c.line,
        backgroundColor: on ? c.accentSoft : "transparent", justifyContent: "center" }}>
      <Text style={{ fontFamily: font.sansSemi, fontSize: 14, color: on ? c.accent : c.ink }}>{on ? "✓ " : ""}{label}</Text>
    </Pressable>
  );
}

/** Single-choice row of pills. */
export function Choice<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: font.sansSemi, fontSize: 12, color: c.muted }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => {
          const on = o.v === value;
          return (
            <Pressable key={String(o.v)} accessibilityRole="radio" accessibilityState={{ selected: on }}
              onPress={() => { tap(); onChange(o.v); }}
              style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1.5, justifyContent: "center",
                borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : "transparent" }}>
              <Text style={{ fontFamily: font.monoBold, fontSize: 13, color: on ? c.surface : c.ink }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Stamp({ st, t, size = 66 }: { st: Stats; t: Dict; size?: number }) {
  const c = useColors();
  const col = { flag: c.flag, unk: c.unk, accent: c.accent }[tone(st)];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t.stampAria(st.y, st.major)}
      style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2.5, borderStyle: "dashed", borderColor: col,
        alignItems: "center", justifyContent: "center", transform: [{ rotate: "-7deg" }] }}>
      <Text style={{ fontFamily: font.monoBold, fontSize: 18, color: col }}>{st.y}/9</Text>
      <Text style={{ fontFamily: font.sansBold, fontSize: 8, letterSpacing: 0.6, color: col }}>
        {stampIsPass(st) ? t.stampLulus : t.stampSemak}
      </Text>
    </View>
  );
}

/** Renders `<b>…</b>` from the i18n verdict strings as bold text (no HTML on native). */
export function RichText({ text, style }: { text: string; style?: object }) {
  const parts = text.split(/(<b>.*?<\/b>)/g).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((p, i) => p.startsWith("<b>")
        ? <Text key={i} style={{ fontFamily: font.serif, fontSize: 17 }}>{p.slice(3, -4)}</Text>
        : p)}
    </Text>
  );
}

export function Sheet({ visible, onClose, title, closeLabel, children }: {
  visible: boolean; onClose: () => void; title: string; closeLabel: string; children: React.ReactNode;
}) {
  const c = useColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.surface }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, gap: 12,
          borderBottomWidth: 1.5, borderBottomColor: c.ink }}>
          <Text accessibilityRole="header" style={{ flex: 1, fontFamily: font.serif, fontSize: 22, color: c.ink }} numberOfLines={2}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} hitSlop={6}
            style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20, color: c.ink }}>×</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 48 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
