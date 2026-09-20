import * as Location from "expo-location";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CRITERIA } from "@/content/criteria";
import { I18N } from "@/content/i18n";
import { ALOR_SETAR_CENTRE } from "@/data/seed";
import { annualCost } from "@/lib/cost";
import { DEFAULT_FILTERS, search, type Filters } from "@/lib/filter";
import { typeLabel } from "@/lib/format";
import type { Kindergarten, Lang } from "@/lib/types";
import { Card } from "./Card";
import { CompareSheet } from "./CompareSheet";
import { DetailSheet } from "./DetailSheet";
import { FilterSheet } from "./FilterSheet";
import { useLang, useOverrides } from "./storage";
import { font, useColors } from "./theme";
import { Btn, tap } from "./ui";

const MAX_COMPARE = 3;
type LocBtn = "useLoc" | "locating" | "locUpdate" | "locBlocked" | "locUnsupported";

export function Finder({ kindergartens }: { kindergartens: readonly Kindergarten[] }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useLang();
  const t = I18N[lang];
  const ov = useOverrides();

  const [f, setF] = useState<Filters>(DEFAULT_FILTERS);
  const set = <K extends keyof Filters>(key: K, v: Filters[K]) => setF((p) => ({ ...p, [key]: v }));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [loc, setLoc] = useState(ALOR_SETAR_CENTRE);
  const [usingCurrent, setUsingCurrent] = useState(false);
  const [locBtn, setLocBtn] = useState<LocBtn>("useLoc");
  const useMyLocation = async () => {
    setLocBtn("locating");
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") return setLocBtn("locBlocked");
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoc({ lat: p.coords.latitude, lng: p.coords.longitude });
      setUsingCurrent(true);
      setLocBtn("locUpdate");
    } catch { setLocBtn("locBlocked"); }
  };

  const [cmp, setCmp] = useState<string[]>([]);
  const [cmpNotice, setCmpNotice] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cmpOpen, setCmpOpen] = useState(false);
  const toggleCmp = (id: string) => {
    if (cmp.includes(id)) { setCmp((x) => x.filter((y) => y !== id)); return setCmpNotice(false); }
    if (cmp.length >= MAX_COMPARE) return setCmpNotice(true);
    setCmpNotice(false);
    setCmp((x) => [...x, id]);
  };

  const { rows, hiddenMajor } = useMemo(
    () => search(kindergartens, f, loc, ov.map, (k) => typeLabel(k, t)),
    [kindergartens, f, loc, ov.map, t],
  );
  const byId = (id: string) => kindergartens.find((k) => k.id === id)!;
  const cmpKs = cmp.map(byId);
  const openK = openId ? byId(openId) : null;
  const barText = cmpNotice ? t.maxCmp : cmp.length < 2 ? `${cmpKs[0]?.name ?? ""} ${t.pilihMin}` : cmpKs.map((k) => k.name).join(" vs ");
  const activeFilters = (Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]).filter((k) => k !== "q" && f[k] !== DEFAULT_FILTERS[k]).length;
  const [guideOpen, setGuideOpen] = useState(false);

  const header = (
    <View style={{ gap: 12, paddingBottom: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: c.ink, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }] }}>
            <Svg width={26} height={26} viewBox="0 0 32 32" fill="none" stroke={c.ink} strokeWidth={2} accessibilityElementsHidden>
              <Path d="M6 14 16 7l10 7" /><Path d="M9 14v9h14v-9" /><Path d="M13 23v-6h6v6" />
            </Svg>
          </View>
          <Text accessibilityRole="header" style={{ fontFamily: font.serif, fontSize: 32, color: c.ink }}>Cari Tadika</Text>
        </View>
        <View accessibilityRole="radiogroup" accessibilityLabel={t.langAria} style={{ flexDirection: "row", borderWidth: 1.5, borderColor: c.ink, borderRadius: 6, overflow: "hidden" }}>
          {(["ms", "en"] as Lang[]).map((l, i) => (
            <Pressable key={l} accessibilityRole="radio" accessibilityState={{ selected: lang === l }} onPress={() => { tap(); setLang(l); }}
              style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: "center", borderLeftWidth: i ? 1.5 : 0, borderLeftColor: c.ink, backgroundColor: lang === l ? c.ink : "transparent" }}>
              <Text style={{ fontFamily: font.monoBold, fontSize: 12, color: lang === l ? c.surface : c.muted }}>{l.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Text style={{ fontFamily: font.sans, fontSize: 16, color: c.muted }}>{t.lede}</Text>
      <View style={{ alignSelf: "flex-start", borderWidth: 2, borderColor: c.unk, borderRadius: 3, paddingHorizontal: 9, paddingVertical: 3, transform: [{ rotate: "-2deg" }] }}>
        <Text style={{ fontFamily: font.monoBold, fontSize: 11, letterSpacing: 0.5, color: c.unk }}>{kindergartens.every((k) => k.source === "sample") ? t.sample : t.unverified}</Text>
      </View>

      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 14, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <Text style={{ flexShrink: 1, fontFamily: font.sans, fontSize: 13, color: c.muted }}>
            {t.distFrom} <Text style={{ fontFamily: font.mono, color: c.ink }}>{usingCurrent ? t.currentLoc : t.defaultLoc}</Text>
          </Text>
          <Btn small label={t[locBtn]} onPress={useMyLocation} disabled={locBtn === "locating"} />
        </View>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: font.sansSemi, fontSize: 12, color: c.muted }}>{t.qLabel}</Text>
            <TextInput value={f.q} onChangeText={(s) => set("q", s)} placeholder={t.qPlaceholder} placeholderTextColor={c.muted}
              autoCorrect={false} returnKeyType="search" clearButtonMode="while-editing" accessibilityLabel={t.qLabel}
              style={{ minHeight: 44, borderBottomWidth: 2, borderBottomColor: c.line, fontFamily: font.sans, fontSize: 16, color: c.ink }} />
          </View>
          <Btn label={activeFilters ? `${t.filtersBtn} · ${activeFilters}` : t.filtersBtn} onPress={() => setFiltersOpen(true)} />
        </View>
      </View>
      <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.sans, fontSize: 13, color: c.muted, marginTop: 6 }}>
        {t.countFound(rows.length)}{hiddenMajor ? t.countHidden(hiddenMajor) : ""}
      </Text>
    </View>
  );

  const footer = (
    <View style={{ marginTop: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 16 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: guideOpen }} onPress={() => setGuideOpen((o) => !o)} style={{ minHeight: 52, justifyContent: "center" }}>
        <Text style={{ fontFamily: font.serif, fontSize: 19, color: c.ink }}>{guideOpen ? "▾" : "▸"} {t.guideTitle}</Text>
      </Pressable>
      {guideOpen && (
        <View style={{ gap: 12, paddingBottom: 16 }}>
          <Text style={{ fontFamily: font.sans, fontSize: 12, color: c.muted }}>{t.guideCredit}</Text>
          {CRITERIA.map((cr, i) => (
            <View key={cr.k} style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: c.accent, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: font.monoBold, fontSize: 12, color: c.accent }}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.sansSemi, fontSize: 14.5, color: c.ink }}>{cr[lang].t}{cr.major ? t.kritikalSuffix : ""}</Text>
                <Text style={{ fontFamily: font.sans, fontSize: 13.5, color: c.muted }}>{cr[lang].tip}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      {kindergartens.some((k) => k.source === "openstreetmap") && (
        <Text style={{ fontFamily: font.sans, fontSize: 12, color: c.muted, marginTop: 14 }}>{t.osmCredit}</Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.k.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 12, paddingBottom: (cmp.length ? 96 : 24) + insets.bottom }}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={{ borderWidth: 1.5, borderStyle: "dashed", borderColor: c.line, borderRadius: 10, padding: 28, backgroundColor: c.surface }}>
          <Text style={{ fontFamily: font.sans, textAlign: "center", color: c.muted }}>{t.emptyMsg}</Text></View>}
        ListFooterComponent={footer}
        renderItem={({ item }) => (
          <Card row={item} annual={annualCost(item.k, f.needTransport)} lang={lang} t={t} ov={ov.map[item.k.id]}
            compared={cmp.includes(item.k.id)} onOpen={() => setOpenId(item.k.id)} onToggleCompare={() => toggleCmp(item.k.id)} />
        )}
      />

      {cmp.length > 0 && (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: c.surface, borderTopWidth: 1.5, borderTopColor: c.ink,
          paddingTop: 10, paddingHorizontal: 16, paddingBottom: 10 + insets.bottom, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text numberOfLines={2} style={{ flex: 1, fontFamily: font.sans, fontSize: 13, color: c.muted }}>{barText}</Text>
          <Btn small label={t.kosongkan} onPress={() => { setCmp([]); setCmpNotice(false); }} />
          <Btn primary label={t.banding} disabled={cmp.length < 2} onPress={() => setCmpOpen(true)} />
        </View>
      )}

      <FilterSheet visible={filtersOpen} t={t} f={f} set={set} onReset={() => setF(DEFAULT_FILTERS)} onClose={() => setFiltersOpen(false)} />
      <DetailSheet k={openK} lang={lang} t={t} loc={loc} ov={openK ? ov.map[openK.id] : undefined} withTransport={f.needTransport}
        compared={openK ? cmp.includes(openK.id) : false} onClose={() => setOpenId(null)}
        onSetStatus={ov.setStatus} onSetNote={ov.setNote} onReset={ov.resetStatuses} onToggleCompare={toggleCmp} />
      <CompareSheet ks={cmpKs} visible={cmpOpen} lang={lang} t={t} loc={loc} ov={ov.map} withTransport={f.needTransport} onClose={() => setCmpOpen(false)} />
    </View>
  );
}
