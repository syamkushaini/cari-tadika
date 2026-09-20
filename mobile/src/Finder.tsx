import * as Location from "expo-location";
import { useMemo, useState } from "react";
import { FlatList, Linking, Pressable, Text, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CRITERIA } from "@/content/criteria";
import { I18N } from "@/content/i18n";
import { DEFAULT_CENTRE } from "@/data/seed";
import { annualCost } from "@/lib/cost";
import { activeFilterChips, ANY_DISTANCE, DEFAULT_FILTERS, search, type Filters } from "@/lib/filter";
import { typeLabel } from "@/lib/format";
import { geocode, type Place } from "@/lib/geocode";
import type { Kindergarten, Lang } from "@/lib/types";
import { Card } from "./Card";
import { CompareSheet } from "./CompareSheet";
import { DetailSheet } from "./DetailSheet";
import { FilterSheet } from "./FilterSheet";
import { useLang, useOverrides } from "./storage";
import { folder, font, useColors, type Colors } from "./theme";
import { Btn, Icon, ICONS, tap, TextBtn } from "./ui";

const Lab = ({ children }: { children: string }) => {
  const c = useColors();
  return <Text style={{ fontFamily: font.sansSemi, fontSize: 12, letterSpacing: 1.1, color: c.muted }}>{children.toUpperCase()}</Text>;
};

/** Inline message: warn (ochre), info (neutral) or err (red). */
function Msg({ kind, text }: { kind: "warn" | "info" | "err"; text: string }) {
  const c: Colors = useColors();
  const m = { warn: { bg: c.unkBg, fg: c.unk, bd: "transparent", d: ICONS.warn }, info: { bg: c.surface2, fg: c.muted, bd: c.line, d: ICONS.info }, err: { bg: c.flagBg, fg: c.flag, bd: c.flag, d: ICONS.err } }[kind];
  return (
    <View accessibilityRole={kind === "info" ? undefined : "alert"} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 12, ...folder(4, 12), borderWidth: 1.5, borderColor: m.bd, backgroundColor: m.bg }}>
      <Icon d={m.d} color={m.fg} />
      <Text style={{ flex: 1, fontFamily: font.sans, fontSize: 14, lineHeight: 20, color: kind === "info" ? c.ink : m.fg }}>{text}</Text>
    </View>
  );
}

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

  const [loc, setLoc] = useState(DEFAULT_CENTRE);
  const [usingCurrent, setUsingCurrent] = useState(false);
  // Typed location: query, matches to choose from, and the label of the chosen one.
  const [locQuery, setLocQuery] = useState("");
  const [locMatches, setLocMatches] = useState<Place[]>([]);
  const [locState, setLocState] = useState<"idle" | "loading" | "none" | "error">("idle");
  const [customLabel, setCustomLabel] = useState<string | null>(null);
  const originName = customLabel ?? (usingCurrent ? t.currentLoc : t.defaultLoc);
  const applyOrigin = (p: { lat: number; lng: number }, label: string | null, gps: boolean) => {
    setLoc({ lat: p.lat, lng: p.lng }); setCustomLabel(label); setUsingCurrent(gps);
  };
  const findLocation = async () => {
    if (!locQuery.trim()) return;
    setLocState("loading"); setLocMatches([]);
    try {
      // Nominatim's policy asks for an identifying User-Agent.
      const r = await geocode(locQuery, (u, init) => fetch(u, { ...init, headers: { ...init?.headers, "User-Agent": "CariTadika/1.0 (iOS app)" } }));
      setLocMatches(r);
      setLocState(r.length ? "idle" : "none");
      if (r.length === 1) { applyOrigin(r[0], r[0].label, false); setLocMatches([]); }
    } catch { setLocState("error"); }
  };
  const [locBtn, setLocBtn] = useState<LocBtn>("useLoc");
  const useMyLocation = async () => {
    setLocBtn("locating");
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") return setLocBtn("locBlocked");
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      applyOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }, null, true);
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
  const chips = activeFilterChips(f, t);
  const [guideOpen, setGuideOpen] = useState(false);

  const header = (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <Svg width={44} height={44} viewBox="0 0 44 44" fill="none" accessibilityElementsHidden>
            <Circle cx={22} cy={22} r={20} stroke={c.ink} strokeWidth={2} />
            <Circle cx={22} cy={22} r={16.5} stroke={c.ink} strokeWidth={1} strokeDasharray="2 2.6" />
            <Path d="M12.5 23 22 14.5 31.5 23M15 21.5V31h14v-9.5M19.5 31v-6h5v6" stroke={c.ink} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
          </Svg>
          <Text accessibilityRole="header" style={{ fontFamily: font.serifBold, fontSize: 27, color: c.ink }}>Cari Tadika</Text>
        </View>
        <View accessibilityRole="radiogroup" accessibilityLabel={t.langAria} style={{ flexDirection: "row", borderWidth: 1.5, borderColor: c.ink, ...folder(4, 12), overflow: "hidden" }}>
          {(["ms", "en"] as Lang[]).map((l, i) => (
            <Pressable key={l} accessibilityRole="radio" accessibilityState={{ selected: lang === l }} accessibilityLabel={l === "ms" ? "Bahasa Melayu" : "English"} onPress={() => { tap(); setLang(l); }}
              style={{ minWidth: 48, minHeight: 44, alignItems: "center", justifyContent: "center", backgroundColor: lang === l ? c.ink : "transparent" }}>
              <Text style={{ fontFamily: font.sansSemi, fontSize: 14, letterSpacing: 0.8, color: lang === l ? c.surface : c.ink }}>{l.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Text style={{ fontFamily: font.sans, fontSize: 15, lineHeight: 22, color: c.muted }}>{t.lede}</Text>
      {kindergartens.every((k) => k.source === "sample") && (
        <View style={{ alignSelf: "flex-start", borderWidth: 2, borderColor: c.unk, borderRadius: 3, paddingHorizontal: 9, paddingVertical: 3, transform: [{ rotate: "-2deg" }] }}>
          <Text style={{ fontFamily: font.monoBold, fontSize: 11, letterSpacing: 0.5, color: c.unk }}>{t.sample}</Text>
        </View>
      )}

      <View accessibilityLabel={t.distFrom} style={{ backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.line, ...folder(4, 14), padding: 14, gap: 12 }}>
        <View style={{ gap: 8 }}>
          <Lab>{t.distFrom.replace(/:$/, "")}</Lab>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Icon d={ICONS.pin} size={20} color={c.ink} sw={1.8} />
            <Text style={{ flexShrink: 1, fontFamily: font.serif, fontSize: 18, color: c.ink }}>{originName}</Text>
            {!customLabel && !usingCurrent && <Text style={{ fontFamily: font.sans, fontSize: 13, color: c.muted }}>{t.dfltTag}</Text>}
          </View>
        </View>
        <Btn label={locBtn === "locating" ? t.locating : t.useLoc} onPress={useMyLocation} disabled={locBtn === "locating"}
          icon={<Icon d={ICONS.locate} color={c.ink} />} />
        {locBtn === "locating" && <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.sans, fontSize: 14, color: c.muted }}>{t.locLoadingSub}</Text>}
        {locBtn === "locBlocked" && (
          <>
            <Msg kind="warn" text={t.locBlockedLong} />
            <Btn label={t.openSettings} onPress={() => Linking.openSettings()} />
          </>
        )}
        {locBtn === "locUnsupported" && <Msg kind="info" text={t.locUnsupportedLong} />}
        <View style={{ gap: 6 }}>
          <Lab>{t.locInputLabel}</Lab>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput value={locQuery} onChangeText={setLocQuery} placeholder={t.locInputPlaceholder} placeholderTextColor={c.muted}
              autoCorrect={false} returnKeyType="search" onSubmitEditing={findLocation} clearButtonMode="while-editing" accessibilityLabel={t.locInputLabel}
              style={{ flex: 1, minHeight: 44, paddingHorizontal: 12, ...folder(4, 12), borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, fontFamily: font.sans, fontSize: 16, color: c.ink }} />
            <Btn primary label={locState === "loading" ? t.locSearching : t.locSearch} onPress={findLocation} disabled={locState === "loading"} />
          </View>
          {locMatches.length > 1 && (
            <View style={{ gap: 6, marginTop: 4 }}>
              <Text style={{ fontFamily: font.sans, fontSize: 14, color: c.muted }}>{t.locPick}</Text>
              {locMatches.map((m) => {
                const [head, ...rest] = m.label.split(", ");
                return (
                  <Pressable key={`${m.lat},${m.lng}`} accessibilityRole="button" onPress={() => { tap(); applyOrigin(m, m.label, false); setLocMatches([]); }}
                    style={{ minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingHorizontal: 14, paddingVertical: 6, ...folder(4, 12), borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: font.sansMed, fontSize: 15, color: c.ink }}>{head}</Text>
                      {rest.length > 0 && <Text style={{ fontFamily: font.sans, fontSize: 13, color: c.muted }}>{rest.join(", ")}</Text>}
                    </View>
                    <Icon d={ICONS.chevron} color={c.ink} sw={2.2} />
                  </Pressable>
                );
              })}
            </View>
          )}
          {locState === "none" && <Msg kind="info" text={t.locNone} />}
          {locState === "error" && (<><Msg kind="err" text={t.locError} /><Btn label={t.retry} onPress={findLocation} /></>)}
          {(customLabel || usingCurrent || locState === "none") && (
            <TextBtn label={t.locDefaultBtn} onPress={() => { applyOrigin(DEFAULT_CENTRE, null, false); setLocQuery(""); setLocBtn("useLoc"); setLocState("idle"); setLocMatches([]); }} />
          )}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View pointerEvents="none" style={{ position: "absolute", left: 12, zIndex: 1 }}><Icon d={ICONS.search} size={20} color={c.muted} /></View>
          <TextInput value={f.q} onChangeText={(s) => set("q", s)} placeholder={t.qLabel} placeholderTextColor={c.muted}
            autoCorrect={false} returnKeyType="search" clearButtonMode="while-editing" accessibilityLabel={t.qLabel}
            style={{ minHeight: 44, paddingLeft: 40, paddingRight: 8, ...folder(4, 12), borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, fontFamily: font.sans, fontSize: 16, color: c.ink }} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${t.filtersBtn}, ${chips.length}`} onPress={() => { tap(); setFiltersOpen(true); }}
          style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, ...folder(4, 12), borderWidth: 1.5, borderColor: c.ink }}>
          <Icon d={ICONS.sliders} color={c.ink} />
          <Text style={{ fontFamily: font.sansSemi, fontSize: 15, color: c.ink }}>{t.filtersBtn}</Text>
          <View style={{ minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: c.ink }}>
            <Text style={{ fontFamily: font.mono, fontSize: 12, color: c.surface }}>{chips.length}</Text>
          </View>
        </Pressable>
      </View>

      {chips.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {chips.map((ch) => (
            <Pressable key={ch.key} accessibilityRole="button" accessibilityLabel={`${ch.label}, ${t.tutup}`} onPress={() => { tap(); setF((p) => ({ ...p, ...ch.clear })); }}
              style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 14, paddingRight: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 4,
                backgroundColor: c.surface2, borderWidth: 1.5, borderColor: c.line }}>
              <Text style={{ fontFamily: font.sansMed, fontSize: 13, color: c.ink }}>{ch.label}</Text>
              <Icon d={ICONS.close} size={14} color={c.ink} sw={2.4} />
            </Pressable>
          ))}
        </View>
      )}

      <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.sans, fontSize: 14, lineHeight: 20, color: c.muted }}>
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
        initialNumToRender={8}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 12, paddingBottom: (cmp.length ? 190 : 24) + insets.bottom }}
        ListHeaderComponent={header}
        ListEmptyComponent={(
          <View style={{ alignItems: "center", gap: 14, padding: 28, borderWidth: 2, borderStyle: "dashed", borderColor: c.line, ...folder(4, 16) }}>
            <Svg width={40} height={40} viewBox="0 0 44 44" fill="none" accessibilityElementsHidden>
              <Circle cx={22} cy={22} r={20} stroke={c.muted} strokeWidth={2} strokeDasharray="4 4" />
              <Path d="M12.5 23 22 14.5 31.5 23M15 21.5V31h14v-9.5" stroke={c.muted} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
            </Svg>
            <Text style={{ fontFamily: font.serif, fontSize: 17, lineHeight: 23, textAlign: "center", color: c.ink }}>{t.emptyMsg}</Text>
            <Btn primary label={t.clearFilters} onPress={() => setF({ ...DEFAULT_FILTERS, hideMajor: false, maxDist: ANY_DISTANCE })} />
          </View>
        )}
        ListFooterComponent={footer}
        renderItem={({ item }) => (
          <Card row={item} annual={annualCost(item.k, f.needTransport)} lang={lang} t={t} ov={ov.map[item.k.id]}
            compared={cmp.includes(item.k.id)} onOpen={() => setOpenId(item.k.id)} onToggleCompare={() => toggleCmp(item.k.id)} />
        )}
      />

      {cmp.length > 0 && (
        <View accessibilityRole="summary" style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: c.surface, borderTopWidth: 1.5, borderTopColor: c.line,
          paddingTop: 12, paddingHorizontal: 16, paddingBottom: 12 + insets.bottom, gap: 10 }}>
          <Text numberOfLines={1} style={{ fontFamily: font.sans, fontSize: 14, color: c.muted }}>
            <Text style={{ fontFamily: font.sansSemi, color: c.ink }}>{t.selectedN(cmp.length)}</Text> {cmpKs.map((k) => k.name).join(", ")}
          </Text>
          {cmpNotice && <Text accessibilityRole="alert" style={{ fontFamily: font.sansSemi, fontSize: 14, color: c.flag }}>{t.maxCmp}</Text>}
          {cmp.length < 2 && <Text style={{ fontFamily: font.sans, fontSize: 14, color: c.muted }}>{t.needTwo}</Text>}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Btn label={t.kosongkan} onPress={() => { setCmp([]); setCmpNotice(false); }} />
            <Btn primary label={`${t.banding} (${cmp.length})`} disabled={cmp.length < 2} onPress={() => setCmpOpen(true)} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      <FilterSheet visible={filtersOpen} t={t} f={f} count={rows.length} set={set} onReset={() => setF({ ...DEFAULT_FILTERS })} onClose={() => setFiltersOpen(false)} />
      <DetailSheet k={openK} lang={lang} t={t} loc={loc} ov={openK ? ov.map[openK.id] : undefined} withTransport={f.needTransport}
        compared={openK ? cmp.includes(openK.id) : false} onClose={() => setOpenId(null)}
        onSetStatus={ov.setStatus} onSetNote={ov.setNote} onReset={ov.resetStatuses} onToggleCompare={toggleCmp} />
      <CompareSheet ks={cmpKs} visible={cmpOpen} lang={lang} t={t} loc={loc} ov={ov.map} withTransport={f.needTransport} onClose={() => setCmpOpen(false)} />
    </View>
  );
}
