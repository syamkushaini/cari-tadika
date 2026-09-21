import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { DATA_URL, parseRemoteListings } from "@/lib/remote";
import type { Kindergarten } from "@/lib/types";

const CACHE_KEY = "cariTadika.listings.v1";

/**
 * Listings the app shows: the copy bundled with the app first, then the last good download from the
 * website, then a fresh download. Anything that fails validation or the network is ignored, so a bad
 * or missing update never blanks the app.
 */
export function useListings(bundled: readonly Kindergarten[]): readonly Kindergarten[] {
  const [list, setList] = useState<readonly Kindergarten[]>(bundled);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        const parsed = cached ? parseRemoteListings(JSON.parse(cached)) : null;
        if (parsed && !cancelled) setList(parsed);
      } catch { /* ignore a corrupt cache */ }
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 12000);
        const res = await fetch(DATA_URL, { signal: ctl.signal, headers: { "Cache-Control": "no-cache" } });
        clearTimeout(timer);
        if (!res.ok) return;
        const json = await res.json();
        const parsed = parseRemoteListings(json);
        if (!parsed || cancelled) return;
        setList(parsed);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(json)).catch(() => {});
      } catch { /* offline or blocked: keep what we have */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return list;
}
