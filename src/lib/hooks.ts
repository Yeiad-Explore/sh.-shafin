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

/** The current year; prerendered pages use the year the site was built for. */
export function useYear(): number {
  return useClientValue(() => new Date().getFullYear(), 2026);
}

// Local date, not UTC: in Dhaka (UTC+6) toISOString() still reports yesterday until 6 AM.
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const todayDay = () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

export function useToday() {
  return { iso: useClientValue(todayISO, ""), day: useClientValue(todayDay, "Sat") };
}

/** A live media query; prerender and hydration assume it doesn't match. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (on) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
