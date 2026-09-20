import { View } from "react-native";
import type { Dict } from "@/content/i18n";
import { ANY_DISTANCE, DEFAULT_FILTERS, type Filters, type SortKey } from "@/lib/filter";
import { folder, useColors } from "./theme";
import { Btn, Seg, Sheet, SwitchRow } from "./ui";

export function FilterSheet({ visible, t, f, count, set, onReset, onClose }: {
  visible: boolean; t: Dict; f: Filters; count: number; set: <K extends keyof Filters>(k: K, v: Filters[K]) => void; onReset: () => void; onClose: () => void;
}) {
  const c = useColors();
  return (
    <Sheet visible={visible} onClose={onClose} title={t.filtersBtn} closeLabel={t.tutup}
      footer={
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34, backgroundColor: c.surface, borderTopWidth: 1.5, borderTopColor: c.line }}>
          <Btn label={t.kosongkan} onPress={onReset} />
          <Btn primary label={t.showN(count)} onPress={onClose} style={{ flex: 1 }} />
        </View>
      }>
      <Seg<SortKey> label={t.sortLabel} value={f.sort} onChange={(v) => set("sort", v)}
        options={[{ v: "score", label: t.sortScore }, { v: "dist", label: t.sortDist }, { v: "cost", label: t.sortCost }]} />
      <Seg label={t.distLabel} value={f.maxDist} onChange={(v) => set("maxDist", v)} mono
        options={[...[3, 5, 10, 25].map((n) => ({ v: n, label: `${n} km` })), { v: ANY_DISTANCE, label: t.distAll }]} />
      <Seg label={t.budgetLabel} value={f.maxBudget} onChange={(v) => set("maxBudget", v)} mono
        options={[...[2000, 4000, 6000, 10000].map((n) => ({ v: n, label: n.toLocaleString("en-MY") })), { v: DEFAULT_FILTERS.maxBudget, label: t.distAll }]} />
      <View style={{ borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, ...folder(4, 14), overflow: "hidden" }}>
        <SwitchRow label={t.onlyReg} on={f.onlyReg} onPress={() => set("onlyReg", !f.onlyReg)} onText="ON" offText="OFF" />
        <SwitchRow label={t.hideMajor} tag={t.defTag} sub={t.hideMajorSub} on={f.hideMajor} onPress={() => set("hideMajor", !f.hideMajor)} onText="ON" offText="OFF" />
        <SwitchRow label={t.onlyTrial} on={f.onlyTrial} onPress={() => set("onlyTrial", !f.onlyTrial)} onText="ON" offText="OFF" />
        <SwitchRow last label={t.needTrans} sub={t.needTransSub} on={f.needTransport} onPress={() => set("needTransport", !f.needTransport)} onText="ON" offText="OFF" />
      </View>
    </Sheet>
  );
}
