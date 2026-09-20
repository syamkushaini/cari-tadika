import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Kindergarten, Lang, OverrideMap, Status } from "@/lib/types";

const LANG_KEY = "cariTadika.lang";
const OV_KEY = "cariTadika.v2";

export function useLang() {
  const [lang, setLang] = useState<Lang>("ms");
  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((v) => { if (v === "en" || v === "ms") setLang(v); }).catch(() => {});
  }, []);
  const choose = useCallback((l: Lang) => { setLang(l); AsyncStorage.setItem(LANG_KEY, l).catch(() => {}); }, []);
  return [lang, choose] as const;
}

/** Per-device overrides + notes (spec §5.1: auth is still an open decision). */
export function useOverrides() {
  const [map, setMap] = useState<OverrideMap>({});
  const ref = useRef(map);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(OV_KEY).then((raw) => {
      try { if (raw) { ref.current = { ...JSON.parse(raw), ...ref.current }; setMap(ref.current); } } catch {}
      loaded.current = true;
    }).catch(() => { loaded.current = true; });
  }, []);

  const update = useCallback((fn: (m: OverrideMap) => OverrideMap) => {
    ref.current = fn(ref.current);
    setMap(ref.current);
    AsyncStorage.setItem(OV_KEY, JSON.stringify(ref.current)).catch(() => {});
  }, []);

  const setStatus = useCallback((k: Kindergarten, key: string, v: Status) => update((m) => {
    const cur = m[k.id] ?? {};
    const statuses = { ...(cur.statuses ?? {}) };
    if (v === k.statuses[key]) delete statuses[key]; else statuses[key] = v;
    return { ...m, [k.id]: { ...cur, statuses } };
  }), [update]);
  const setNote = useCallback((id: string, note: string) => update((m) => ({ ...m, [id]: { ...(m[id] ?? {}), note } })), [update]);
  const resetStatuses = useCallback((id: string) => update((m) => {
    const rest = { ...(m[id] ?? {}) }; delete rest.statuses; return { ...m, [id]: rest };
  }), [update]);

  return { map, setStatus, setNote, resetStatuses };
}
