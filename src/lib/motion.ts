"use client";

import type Lenis from "lenis";

let lenis: Lenis | null = null;
let ready = false;
const readyCallbacks = new Set<() => void>();

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

/** The site's ease-out curve, for Framer Motion transitions of 400–800ms. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Fires once the preloader has finished (or immediately if it was skipped). */
export function markReady() {
  if (ready) return;
  ready = true;
  readyCallbacks.forEach((cb) => cb());
  readyCallbacks.clear();
}

export function whenReady(cb: () => void): () => void {
  if (ready) {
    cb();
    return () => {};
  }
  readyCallbacks.add(cb);
  return () => readyCallbacks.delete(cb);
}

export function scrollToTarget(target: string | number | HTMLElement, opts: { duration?: number } = {}) {
  const reduced = prefersReducedMotion();
  const navH = typeof window !== "undefined" && window.innerWidth < 768 ? 60 : 72;
  let el: HTMLElement | null = null;
  if (typeof target === "string") el = document.querySelector<HTMLElement>(target);
  else if (typeof target !== "number") el = target;

  if (lenis && !reduced) {
    lenis.scrollTo(el ?? (target as number), {
      offset: el ? -navH + 1 : 0,
      duration: opts.duration ?? 1.2,
      easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    });
    return;
  }
  const top = el ? el.getBoundingClientRect().top + window.scrollY - navH + 1 : (target as number);
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}

export const BLOOM_EVENT = "shs:bloom";
export function triggerBloom() {
  window.dispatchEvent(new CustomEvent(BLOOM_EVENT));
}
