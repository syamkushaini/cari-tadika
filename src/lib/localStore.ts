"use client";
import { useCallback, useSyncExternalStore } from "react";

// Same-tab writes don't fire the "storage" event, so we notify listeners ourselves.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
};

const readRaw = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };

/** Raw localStorage string for `key` (null on the server / when blocked), plus a setter. SSR-safe. */
export function useLocalStorageRaw(key: string) {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null);
  const write = useCallback((v: string) => { try { localStorage.setItem(key, v); } catch {} notify(); }, [key]);
  return [raw, write] as const;
}
