import type { CSSProperties, ReactNode } from "react";

export function PlateHeader({ label, title, id, growth = true }: { label: string; title: ReactNode; id?: string; growth?: boolean }) {
  return (
    <header className="plate-header" data-inview="">
      <p className="plate-header__eyebrow t-label">{label}</p>
      <h2 id={id} className="plate-header__title t-display t-h2" data-split="">
        {title}
      </h2>
      {growth && <span data-growth="section" style={{ position: "absolute", left: 0, top: 6, width: 1, height: 1 }} aria-hidden="true" />}
    </header>
  );
}

export function LeaderLabel({
  children,
  reverse,
  length = 56,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  reverse?: boolean;
  length?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <span
      className={`leader ${reverse ? "leader--rev" : ""} ${className}`}
      style={{ "--len": `${length}px`, "--delay": `${delay}ms` } as CSSProperties}
    >
      <span className="leader__dot" />
      <span className="leader__line" />
      <span className="leader__text t-label">{children}</span>
    </span>
  );
}

/** Deterministic small tilt for pressed tags and notes (−1.5° … 1.5°). */
export function tilt(i: number, max = 1.5): string {
  const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  const f = v - Math.floor(v);
  return `${((f * 2 - 1) * max).toFixed(2)}deg`;
}

export function LeafGlyph({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 30 30" className={className} style={style} aria-hidden="true">
      <path className="draw" pathLength={1} d="M4 26 C 6 14, 14 6, 26 4 C 24 16, 16 24, 4 26 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path className="draw" pathLength={1} d="M4 26 L 18 12" fill="none" stroke="currentColor" strokeWidth="1" style={{ "--delay": "300ms" } as CSSProperties} />
    </svg>
  );
}

export function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      →
    </span>
  );
}
