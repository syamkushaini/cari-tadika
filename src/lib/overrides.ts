"use client";
// Per-device persistence of parent overrides + visit notes (spec §5.1: open decision).
// Isolated behind this hook so a server-backed store can replace it later.
import { useCallback, useMemo } from "react";
import { useLocalStorageRaw } from "./localStore";
import type { Kindergarten, OverrideMap, Status } from "./types";

const KEY = "cariTadika.v2";
const parse = (raw: string | null): OverrideMap => {
  try { return (raw && JSON.parse(raw)) || {}; } catch { return {}; }
};

export function useOverrides() {
  const [raw, write] = useLocalStorageRaw(KEY);
  const map = useMemo(() => parse(raw), [raw]);
  // Always edit from the freshest persisted value so rapid edits (typing) don't drop updates.
  const update = useCallback((fn: (m: OverrideMap) => OverrideMap) => {
    let cur: string | null = null;
    try { cur = localStorage.getItem(KEY); } catch {}
    write(JSON.stringify(fn(parse(cur))));
  }, [write]);

  /** Setting a status equal to the base value clears the override. */
  const setStatus = useCallback((k: Kindergarten, key: string, v: Status) => update((m) => {
    const cur = m[k.id] ?? {};
    const statuses = { ...(cur.statuses ?? {}) };
    if (v === k.statuses[key]) delete statuses[key]; else statuses[key] = v;
    return { ...m, [k.id]: { ...cur, statuses } };
  }), [update]);

  const setNote = useCallback((id: string, note: string) => update((m) => ({ ...m, [id]: { ...(m[id] ?? {}), note } })), [update]);
  const resetStatuses = useCallback((id: string) => update((m) => {
    const rest = { ...(m[id] ?? {}) };
    delete rest.statuses;
    return { ...m, [id]: rest };
  }), [update]);

  return { map, setStatus, setNote, resetStatuses };
}
