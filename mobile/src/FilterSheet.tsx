import { View } from "react-native";
import type { Dict } from "@/content/i18n";
import { DEFAULT_FILTERS, type Filters, type SortKey } from "@/lib/filter";
import { Btn, Chip, Choice, Sheet } from "./ui";

export function FilterSheet({ visible, t, f, set, onReset, onClose }: {
  visible: boolean; t: Dict; f: Filters; set: <K extends keyof Filters>(k: K, v: Filters[K]) => void; onReset: () => void; onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={t.filtersAria} closeLabel={t.tutup}>
      <Choice label={t.distLabel} value={f.maxDist} onChange={(v) => set("maxDist", v)}
        options={[...[3, 5, 10, 25].map((n) => ({ v: n, label: `${n} km` })), { v: 999, label: t.distAll }]} />
      <Choice label={t.budgetLabel} value={f.maxBudget} onChange={(v) => set("maxBudget", v)}
        options={[...[2000, 4000, 6000, 10000].map((n) => ({ v: n, label: `RM ${n.toLocaleString("en-MY")}` })), { v: 999999, label: t.distAll }]} />
      <Choice<SortKey> label={t.sortLabel} value={f.sort} onChange={(v) => set("sort", v)}
        options={[{ v: "score", label: t.sortScore }, { v: "dist", label: t.sortDist }, { v: "cost", label: t.sortCost }]} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Chip label={t.onlyReg} on={f.onlyReg} onPress={() => set("onlyReg", !f.onlyReg)} />
        <Chip label={t.hideMajor} on={f.hideMajor} onPress={() => set("hideMajor", !f.hideMajor)} />
        <Chip label={t.onlyTrial} on={f.onlyTrial} onPress={() => set("onlyTrial", !f.onlyTrial)} />
        <Chip label={t.needTrans} on={f.needTransport} onPress={() => set("needTransport", !f.needTransport)} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Btn label={t.kosongkan} onPress={onReset} style={{ flex: 1 }} />
        <Btn primary label={t.tutup} onPress={onClose} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}
export { DEFAULT_FILTERS };
