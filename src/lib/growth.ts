"use client";

import { useEffect, useRef } from "react";

/**
 * Shared state for the Growth Line: the document-y of the line's drawn tip.
 * Elements can subscribe to "the line has reached me" (timeline nodes budding, leaves unfurling…).
 */
type Listener = (tipY: number) => void;

let tip = 0;
const listeners = new Set<Listener>();

export const growth = {
  get tip() {
    return tip;
  },
  set(y: number) {
    if (y === tip) return;
    tip = y;
    listeners.forEach((l) => l(y));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    l(tip);
    return () => {
      listeners.delete(l);
    };
  },
};

/** Calls onReach once, the first time the growth tip passes the element's vertical centre (+ offset). */
export function useGrowthReach<T extends HTMLElement | SVGElement>(onReach: () => void, offset = 0) {
  const ref = useRef<T | null>(null);
  const cb = useRef(onReach);
  useEffect(() => {
    cb.current = onReach;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const unsub = growth.subscribe((y) => {
      if (done) return;
      const r = el.getBoundingClientRect();
      const ey = r.top + window.scrollY + r.height / 2 + offset;
      if (y >= ey) {
        done = true;
        cb.current();
        queueMicrotask(() => unsub());
      }
    });
    return () => {
      unsub();
    };
  }, [offset]);
  return ref;
}
