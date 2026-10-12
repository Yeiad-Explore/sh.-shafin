"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { growth } from "@/lib/growth";
import { prefersReducedMotion } from "@/lib/motion";

interface Sampled {
  el: SVGPathElement;
  total: number;
  ys: Float32Array;
  ls: Float32Array;
  last: number;
}

const STRANDS = [
  { colour: "var(--bio)", offset: -14 },
  { colour: "var(--chem)", offset: -9 },
  { colour: "var(--phy)", offset: 9 },
  { colour: "var(--math)", offset: 14 },
];

function sample(el: SVGPathElement): Sampled {
  const total = el.getTotalLength();
  const n = Math.min(1600, Math.max(48, Math.ceil(total / 10)));
  const ys = new Float32Array(n + 1);
  const ls = new Float32Array(n + 1);
  let maxY = -Infinity;
  for (let i = 0; i <= n; i++) {
    const l = (total * i) / n;
    const p = el.getPointAtLength(l);
    maxY = Math.max(maxY, p.y);
    ys[i] = maxY;
    ls[i] = l;
  }
  el.style.strokeDasharray = `${total} ${total}`;
  el.style.strokeDashoffset = `${total}`;
  return { el, total, ys, ls, last: -1 };
}

/** Drawn length of a path whose tip has reached document-y `y`. */
function lengthAt(s: Sampled, y: number): number {
  const { ys, ls } = s;
  const n = ys.length - 1;
  if (y <= ys[0]) return 0;
  if (y >= ys[n]) return s.total;
  let lo = 0;
  let hi = n;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ys[mid] <= y) lo = mid;
    else hi = mid;
  }
  const span = ys[hi] - ys[lo];
  const t = span > 0 ? (y - ys[lo]) / span : 0;
  return ls[lo] + (ls[hi] - ls[lo]) * t;
}

/**
 * The Growth Line — one continuous glowing beam planted in the hero, measured at runtime from
 * [data-growth] anchors, drawn by scroll position (with a slight lag), and retracting on the way up.
 */
export default function GrowthLine() {
  const svgRef = useRef<SVGSVGElement>(null);
  const mainRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGGElement>(null);
  const strandRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    const svg = svgRef.current;
    const main = mainRef.current;
    const glow = glowRef.current;
    const tip = tipRef.current;
    const root = svg?.parentElement;
    if (!svg || !main || !glow || !tip || !root) return;

    const reduced = prefersReducedMotion();
    let paths: Sampled[] = [];
    let current = 0;
    let originY = 0;
    let raf = 0;
    let lastT = performance.now();
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const build = () => {
      const mobile = window.innerWidth < 768;
      const rootRect = root.getBoundingClientRect();
      const ox = rootRect.left;
      originY = rootRect.top + window.scrollY;
      svg.style.height = `${root.scrollHeight}px`;
      svg.querySelector("#growth-beam")?.setAttribute("y2", String(root.scrollHeight));

      const anchors = Array.from(root.querySelectorAll<HTMLElement>("[data-growth]")).filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0,
      );
      const pts: { x: number; y: number; curl: boolean }[] = [];
      for (const el of anchors) {
        const r = el.getBoundingClientRect();
        const gx = el.dataset.gx ?? "left";
        const gy = el.dataset.gy ?? "center";
        const kind = el.dataset.growth;
        let x = gx === "center" ? r.left + r.width / 2 : gx === "right" ? r.right : r.left;
        x += Number(el.dataset.gdx ?? 0);
        let y = gy === "top" ? r.top : gy === "bottom" ? r.bottom : r.top + r.height / 2;
        y += Number(el.dataset.gdy ?? 0);
        const docY = y + window.scrollY - originY;
        const px = mobile && kind !== "seed" ? 12 : x - ox;
        const prev = pts[pts.length - 1];
        if (prev && docY <= prev.y + 8) continue;
        pts.push({ x: px, y: docY, curl: mobile && kind === "section" });
      }
      if (pts.length < 2) {
        main.setAttribute("d", "");
        glow.setAttribute("d", "");
        paths = [];
        return;
      }

      let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1];
        const q = pts[i];
        if (q.curl && q.y - p.y > 120) {
          // a small curl as the line enters a new plate (mobile)
          const a = q.y - 34;
          const k = Math.min((a - p.y) * 0.5, 200);
          d += ` C${p.x},${p.y + k} ${q.x},${a - k} ${q.x},${a}`;
          d += ` C${q.x + 16},${a + 2} ${q.x + 16},${a + 24} ${q.x + 5},${a + 24}`;
          d += ` C${q.x - 5},${a + 24} ${q.x - 4},${a + 12} ${q.x + 3},${a + 13}`;
          d += ` C${q.x + 9},${a + 14} ${q.x},${a + 26} ${q.x},${q.y}`;
        } else {
          const k = Math.min((q.y - p.y) * 0.5, 320);
          d += ` C${p.x.toFixed(1)},${(p.y + k).toFixed(1)} ${q.x.toFixed(1)},${(q.y - k).toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`;
        }
      }
      main.setAttribute("d", d);
      glow.setAttribute("d", d);
      paths = [sample(main)];
      glow.style.strokeDasharray = main.style.strokeDasharray;

      // Courses: the four subject branches run beside the stem like pressed stems, then rejoin.
      const strandHost = root.querySelector<HTMLElement>("[data-growth-strands]");
      strandRefs.current.forEach((el) => el?.setAttribute("d", ""));
      if (strandHost && !mobile) {
        const r = strandHost.getBoundingClientRect();
        const x = r.left - ox + Number(strandHost.dataset.gdx ?? -28);
        const top = r.top + window.scrollY - originY;
        const bottom = r.bottom + window.scrollY - originY;
        if (bottom - top > 260) {
          STRANDS.forEach((s, i) => {
            const el = strandRefs.current[i];
            if (!el) return;
            const ox2 = x + s.offset;
            el.setAttribute(
              "d",
              `M${x},${top} C${x},${top + 60} ${ox2},${top + 60} ${ox2},${top + 120} L${ox2},${bottom - 120} C${ox2},${bottom - 60} ${x},${bottom - 60} ${x},${bottom}`,
            );
            paths.push(sample(el));
          });
        }
      }

      if (reduced) {
        paths.forEach((p) => (p.el.style.strokeDashoffset = "0"));
        glow.style.strokeDashoffset = "0";
        growth.set(Number.POSITIVE_INFINITY);
      } else {
        current = targetY();
        render(true);
      }
    };

    const targetY = () => {
      const vh = window.innerHeight;
      const sy = window.scrollY;
      const maxS = Math.max(1, document.documentElement.scrollHeight - vh);
      const a = maxS - vh * 0.6;
      const t = Math.min(1, Math.max(0, (sy - a) / (maxS - a)));
      const near = t * t * (3 - 2 * t);
      return sy + vh * (0.62 + 0.38 * near) - originY;
    };

    const render = (force = false) => {
      for (const p of paths) {
        const len = lengthAt(p, current);
        if (force || Math.abs(len - p.last) > 0.25) {
          p.el.style.strokeDashoffset = `${(p.total - len).toFixed(2)}`;
          p.last = len;
        }
      }
      const head = paths[0];
      if (head) {
        glow.style.strokeDashoffset = head.el.style.strokeDashoffset;
        const visible = head.last > 2 && head.last < head.total - 2;
        tip.style.opacity = visible ? "1" : "0";
        if (visible) {
          const p = head.el.getPointAtLength(head.last);
          tip.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
        }
      }
      growth.set(current + originY);
    };

    const tick = (now: number) => {
      const dt = Math.min(64, now - lastT) / 1000;
      lastT = now;
      const target = targetY();
      const diff = target - current;
      if (Math.abs(diff) > 0.2) {
        current += diff * (1 - Math.exp(-dt / 0.2));
        render();
      } else if (diff !== 0) {
        current = target;
        render();
      }
      raf = requestAnimationFrame(tick);
    };

    const schedule = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    };

    build();
    if (!reduced) raf = requestAnimationFrame(tick);
    document.fonts?.ready.then(build).catch(() => {});
    window.addEventListener("load", build);
    const ro = new ResizeObserver(schedule);
    ro.observe(root);
    ScrollTrigger.addEventListener("refresh", schedule);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      ro.disconnect();
      window.removeEventListener("load", build);
      ScrollTrigger.removeEventListener("refresh", schedule);
    };
  }, []);

  return (
    <svg ref={svgRef} className="growth" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="growth-beam" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="4000">
          <stop offset="0" style={{ stopColor: "var(--accent)" }} />
          <stop offset="0.5" style={{ stopColor: "var(--accent-2)" }} />
          <stop offset="1" style={{ stopColor: "var(--accent)" }} />
        </linearGradient>
        <radialGradient id="growth-tip">
          <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.9 }} />
          <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      {STRANDS.map((s, i) => (
        <path
          key={s.colour}
          ref={(el) => {
            strandRefs.current[i] = el;
          }}
          className="growth__strand"
          style={{ stroke: s.colour }}
        />
      ))}
      <path ref={glowRef} className="growth__glow" />
      <path ref={mainRef} className="growth__main" />
      <g ref={tipRef} className="growth__tip">
        <circle r="18" fill="url(#growth-tip)" />
        <circle r="2.5" className="growth__tip-core" />
      </g>
    </svg>
  );
}
