"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/lib/motion";

/** A ring that draws itself, then the tick inside it. */
export default function SuccessCheck({ size = 64, className = "" }: { size?: number; className?: string }) {
  const reduce = useReducedMotion();
  const t = (delay: number, duration: number) => ({ duration: reduce ? 0 : duration, ease: EASE_OUT, delay: reduce ? 0 : delay });
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`success-check ${className}`} aria-hidden="true">
      <motion.circle cx="32" cy="32" r="28" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={t(0.1, 0.6)} />
      <motion.path d="M20 33 L28.5 41.5 L44.5 24.5" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={t(0.55, 0.45)} />
    </svg>
  );
}
