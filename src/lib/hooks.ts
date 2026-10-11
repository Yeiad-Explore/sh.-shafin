"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** A value read only in the browser; `server` is used for prerender and hydration. */
export function useClientValue<T>(read: () => T, server: T): T {
  return useSyncExternalStore(noop, read, () => server);
}

export function useMounted(): boolean {
  return useClientValue(() => true, false);
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const todayDay = () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

export function useToday() {
  return { iso: useClientValue(todayISO, ""), day: useClientValue(todayDay, "Sat") };
}
