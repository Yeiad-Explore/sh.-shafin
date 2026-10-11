"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const dl = (ms: number, dur?: number) => ({ "--delay": `${ms}ms`, ...(dur ? { "--dur": `${dur}ms` } : {}) }) as CSSProperties;

/* ─────────────── Biology: a leaf draws, veins branch, then it zooms into a plant cell ─────────────── */
const VEINS: [number, number][] = [
  [420, 72],
  [366, 112],
  [312, 132],
  [258, 128],
  [204, 106],
  [150, 74],
];

export function BiologyDrawing({ simple = false }: { simple?: boolean }) {
  const veins = simple ? VEINS.filter((_, i) => i % 2 === 0) : VEINS;
  return (
    <svg viewBox="0 0 680 520" role="img" aria-label="A leaf with its veins drawn from the midrib, zooming into a labelled plant cell: cell wall, nucleus, chloroplasts and vacuole.">
      {/* the leaf, which later shrinks into the corner as a 'specimen' with a zoom callout */}
      <g className="bio-leaf">
        <path className="art-c draw art-tint" pathLength={1} style={dl(0)} d="M300 470 C 170 404, 150 244, 300 40 C 450 244, 430 404, 300 470 Z" />
        <path className="art-c draw" pathLength={1} style={dl(300, 1200)} d="M300 504 L 300 58" />
        {veins.map(([y, w], i) => (
          <g key={y}>
            <path className="art-c draw art-thin" pathLength={1} style={dl(700 + i * 120, 700)} d={`M300 ${y} Q ${300 - w * 0.45} ${y - 16} ${300 - w * 0.85} ${y - 50}`} />
            <path className="art-c draw art-thin" pathLength={1} style={dl(760 + i * 120, 700)} d={`M300 ${y} Q ${300 + w * 0.45} ${y - 16} ${300 + w * 0.85} ${y - 50}`} />
          </g>
        ))}
        <circle className="art-ink draw bio-zoomring" pathLength={1} style={dl(2100, 500)} cx="300" cy="300" r="34" strokeDasharray="1 1" />
      </g>

      <g className="bio-cell">
        <line className="art-ink draw art-thin" pathLength={1} style={dl(2700, 500)} x1="120" y1="96" x2="196" y2="118" strokeDasharray="3 4" />
        <line className="art-ink draw art-thin" pathLength={1} style={dl(2700, 500)} x1="120" y1="150" x2="196" y2="410" strokeDasharray="3 4" />
        <rect className="art-ink draw" pathLength={1} style={dl(2900, 900)} x="196" y="104" width="300" height="320" rx="30" />
        <rect className="art-c draw art-thin" pathLength={1} style={dl(3100, 900)} x="206" y="114" width="280" height="300" rx="22" />
        {/* vacuole */}
        <path className="art-ink draw art-thin" pathLength={1} style={dl(3400, 900)} d="M262 196 C 300 168, 380 172, 410 204 C 440 238, 424 330, 380 352 C 330 376, 268 360, 250 318 C 232 276, 236 214, 262 196 Z" />
        {/* nucleus */}
        <circle className="art-ink draw" pathLength={1} style={dl(3700, 600)} cx="436" cy="170" r="30" />
        <circle className="art-dot bud" style={dl(4100)} cx="442" cy="166" r="7" />
        {/* chloroplasts */}
        {(simple
          ? [
              [234, 150, -20],
              [456, 330, 30],
              [300, 396, 0],
            ]
          : [
              [234, 150, -20],
              [226, 300, 80],
              [456, 330, 30],
              [300, 396, 0],
              [384, 136, 10],
            ]
        ).map(([cx, cy, r], i) => (
          <g key={i} transform={`rotate(${r} ${cx} ${cy})`}>
            <ellipse className="art-c draw art-tint" pathLength={1} style={dl(3900 + i * 120, 500)} cx={cx} cy={cy} rx="20" ry="9" />
            <line className="art-c draw art-thin" pathLength={1} style={dl(4100 + i * 120, 300)} x1={cx - 10} y1={cy - 2} x2={cx + 10} y2={cy - 2} />
            <line className="art-c draw art-thin" pathLength={1} style={dl(4150 + i * 120, 300)} x1={cx - 8} y1={cy + 3} x2={cx + 8} y2={cy + 3} />
          </g>
        ))}
        {/* labels */}
        <g className="art-labels">
          <line className="art-ink draw art-thin" pathLength={1} style={dl(4500, 240)} x1="496" y1="260" x2="560" y2="260" />
          <circle className="art-dot bud" style={dl(4700)} cx="496" cy="260" r="3" />
          <text className="art-label appear" style={dl(4800)} x="568" y="264">Cell wall</text>

          <line className="art-ink draw art-thin" pathLength={1} style={dl(4650, 240)} x1="466" y1="170" x2="560" y2="150" />
          <circle className="art-dot bud" style={dl(4850)} cx="466" cy="170" r="3" />
          <text className="art-label appear" style={dl(4950)} x="568" y="154">Nucleus</text>

          <line className="art-ink draw art-thin" pathLength={1} style={dl(4800, 240)} x1="474" y1="338" x2="560" y2="370" />
          <circle className="art-dot bud" style={dl(5000)} cx="474" cy="338" r="3" />
          <text className="art-label appear" style={dl(5100)} x="568" y="374">Chloroplast</text>

          <line className="art-ink draw art-thin" pathLength={1} style={dl(4950, 240)} x1="330" y1="270" x2="330" y2="470" />
          <circle className="art-dot bud" style={dl(5150)} cx="330" cy="270" r="3" />
          <text className="art-label appear" style={dl(5250)} x="300" y="490">Vacuole</text>

          <text className="art-label appear" style={{ ...dl(2800), fill: "var(--page-fg-2)" }} x="58" y="214">× 400</text>
        </g>
      </g>
    </svg>
  );
}

/* ─────────────── Chemistry: benzene draws bond by bond, resonance flickers once ─────────────── */
const R = 110;
const C = { x: 340, y: 200 };
const hex = Array.from({ length: 6 }, (_, i) => {
  const a = (Math.PI / 3) * i - Math.PI / 2;
  return { x: C.x + R * Math.cos(a), y: C.y + R * Math.sin(a) };
});
function inner(i: number) {
  const a = hex[i];
  const b = hex[(i + 1) % 6];
  const k = 0.82;
  const sh = 0.18;
  const ax = C.x + (a.x - C.x) * k;
  const ay = C.y + (a.y - C.y) * k;
  const bx = C.x + (b.x - C.x) * k;
  const by = C.y + (b.y - C.y) * k;
  return { x1: ax + (bx - ax) * sh, y1: ay + (by - ay) * sh, x2: bx - (bx - ax) * sh, y2: by - (by - ay) * sh };
}

export function ChemistryDrawing() {
  return (
    <svg viewBox="0 0 680 520" role="img" aria-label="A benzene ring drawn bond by bond with alternating double bonds, and a bromination reaction arrow below it.">
      {hex.map((p, i) => {
        const q = hex[(i + 1) % 6];
        return <line key={i} className="art-ink draw" pathLength={1} style={dl(i * 180, 420)} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
      })}
      {hex.map((p, i) => (
        <circle key={`v${i}`} className="art-dot bud" style={dl(i * 180 + 300)} cx={p.x} cy={p.y} r="3" />
      ))}
      <g className="chem-res-a">
        {[0, 2, 4].map((i) => (
          <line key={i} className="art-c draw" pathLength={1} style={dl(1200 + i * 100, 360)} {...inner(i)} />
        ))}
      </g>
      <g className="chem-res-b">
        {[1, 3, 5].map((i) => (
          <line key={i} className="art-c" {...inner(i)} />
        ))}
      </g>
      {/* H labels */}
      {hex.map((p, i) => {
        const ox = (p.x - C.x) * 0.32;
        const oy = (p.y - C.y) * 0.32;
        return (
          <g key={`h${i}`}>
            <line className="art-ink draw art-thin" pathLength={1} style={dl(1700 + i * 60, 240)} x1={p.x + ox * 0.15} y1={p.y + oy * 0.15} x2={p.x + ox * 0.7} y2={p.y + oy * 0.7} />
            <text className="art-label appear" style={{ ...dl(1900 + i * 60), fontSize: 13 }} x={p.x + ox - 5} y={p.y + oy + 5}>
              H
            </text>
          </g>
        );
      })}

      {/* leader label */}
      <line className="art-ink draw art-thin" pathLength={1} style={dl(2300, 240)} x1="440" y1="120" x2="530" y2="80" />
      <circle className="art-dot bud" style={dl(2500)} cx="440" cy="120" r="3" />
      <text className="art-label art-formula appear" style={dl(2600)} x="538" y="84">Benzene · C₆H₆</text>
      <text className="art-label appear" style={{ ...dl(2700), fill: "var(--page-fg-2)" }} x="538" y="102">Delocalised π</text>

      {/* reaction arrow */}
      <text className="art-label art-formula appear" style={{ ...dl(2900), fontSize: 14 }} x="60" y="440">C₆H₆ + Br₂</text>
      <line className="art-ink draw" pathLength={1} style={dl(3000, 700)} x1="210" y1="435" x2="440" y2="435" />
      <path className="art-ink draw" pathLength={1} style={dl(3600, 240)} d="M428 427 L 442 435 L 428 443" />
      <text className="art-label art-formula appear" style={{ ...dl(3400), fill: "var(--c)" }} x="290" y="422">FeBr₃</text>
      <text className="art-label art-formula appear" style={{ ...dl(3800), fontSize: 14 }} x="460" y="440">C₆H₅Br + HBr</text>
      <text className="art-label appear" style={{ ...dl(4000), fill: "var(--page-fg-2)" }} x="210" y="466">Electrophilic substitution</text>
    </svg>
  );
}

/* ─────────────── Physics: a pendulum with ghost trail, its displacement plotted live ─────────────── */
const PIV = { x: 200, y: 60 };
const LEN = 210;
const THETA0 = 0.48;
const PERIOD = 2.4;
const GRAPH = { x0: 60, x1: 640, y: 420, amp: 46 };

export function PhysicsDrawing({ active }: { active: boolean }) {
  const rodRef = useRef<SVGLineElement>(null);
  const bobRef = useRef<SVGCircleElement>(null);
  const ghostRefs = useRef<(SVGCircleElement | null)[]>([]);
  const traceRef = useRef<SVGPolylineElement>(null);
  const penRef = useRef<SVGCircleElement>(null);
  const vRef = useRef<SVGLineElement>(null);
  const fRef = useRef<SVGLineElement>(null);
  const vLabel = useRef<SVGTextElement>(null);
  const fLabel = useRef<SVGTextElement>(null);
  const tRef = useRef(PERIOD * 0.12);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ghosts: { x: number; y: number }[] = [];
    const pts: string[] = [];
    let prevLocal = -1;
    let raf = 0;
    let last = performance.now();
    const t0 = performance.now();

    const draw = (t: number) => {
      const w = (2 * Math.PI) / PERIOD;
      const th = THETA0 * Math.cos(w * t);
      const om = -THETA0 * w * Math.sin(w * t);
      const bx = PIV.x + LEN * Math.sin(th);
      const by = PIV.y + LEN * Math.cos(th);
      rodRef.current?.setAttribute("x2", bx.toFixed(1));
      rodRef.current?.setAttribute("y2", by.toFixed(1));
      bobRef.current?.setAttribute("cx", bx.toFixed(1));
      bobRef.current?.setAttribute("cy", by.toFixed(1));

      ghosts.unshift({ x: bx, y: by });
      if (ghosts.length > 30) ghosts.length = 30;
      ghostRefs.current.forEach((g, i) => {
        const p = ghosts[(i + 1) * 5];
        if (!g) return;
        if (p) {
          g.setAttribute("cx", p.x.toFixed(1));
          g.setAttribute("cy", p.y.toFixed(1));
          g.style.opacity = String(0.3 - i * 0.05);
        } else g.style.opacity = "0";
      });

      // tangent unit vector (direction of increasing θ)
      const tx = Math.cos(th);
      const ty = -Math.sin(th);
      const vScale = om * 26;
      const fScale = -Math.sin(th) * 120;
      vRef.current?.setAttribute("x1", bx.toFixed(1));
      vRef.current?.setAttribute("y1", by.toFixed(1));
      vRef.current?.setAttribute("x2", (bx + tx * vScale).toFixed(1));
      vRef.current?.setAttribute("y2", (by + ty * vScale).toFixed(1));
      fRef.current?.setAttribute("x1", bx.toFixed(1));
      fRef.current?.setAttribute("y1", (by + 24).toFixed(1));
      fRef.current?.setAttribute("x2", (bx + tx * fScale).toFixed(1));
      fRef.current?.setAttribute("y2", (by + 24 + ty * fScale).toFixed(1));
      vLabel.current?.setAttribute("x", (bx + tx * vScale + (vScale >= 0 ? 6 : -16)).toFixed(1));
      vLabel.current?.setAttribute("y", (by + ty * vScale - 6).toFixed(1));
      fLabel.current?.setAttribute("x", (bx + tx * fScale + (fScale >= 0 ? 6 : -16)).toFixed(1));
      fLabel.current?.setAttribute("y", (by + 24 + ty * fScale + 14).toFixed(1));

      // displacement plot: two periods across the graph, then it restarts
      const span = PERIOD * 2;
      const local = t % span;
      if (local < prevLocal) pts.length = 0;
      prevLocal = local;
      const gx = GRAPH.x0 + ((GRAPH.x1 - GRAPH.x0) * local) / span;
      const gy = GRAPH.y - (th / THETA0) * GRAPH.amp;
      pts.push(`${gx.toFixed(1)},${gy.toFixed(1)}`);
      traceRef.current?.setAttribute("points", pts.join(" "));
      penRef.current?.setAttribute("cx", gx.toFixed(1));
      penRef.current?.setAttribute("cy", gy.toFixed(1));
    };

    if (reduced || !active) {
      // a good frozen frame: mid-swing, with a partly drawn trace
      for (let t = 0; t <= PERIOD * 1.35; t += 0.03) draw(t);
      return;
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (now - t0 > 1500) tRef.current += dt;
      draw(tRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <svg viewBox="0 0 680 520" role="img" aria-label="A swinging pendulum with velocity and restoring-force arrows; below it, its displacement is plotted over time as a sine wave.">
      <line className="art-ink draw" pathLength={1} style={dl(0, 400)} x1="140" y1="60" x2="260" y2="60" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} className="art-ink draw art-thin" pathLength={1} style={dl(200 + i * 40, 200)} x1={150 + i * 20} y1="60" x2={140 + i * 20} y2="48" />
      ))}
      <line className="art-ink art-thin" x1={PIV.x} y1={PIV.y} x2={PIV.x} y2={PIV.y + LEN + 30} strokeDasharray="2 5" opacity="0.5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          ref={(el) => {
            ghostRefs.current[i] = el;
          }}
          cx={PIV.x}
          cy={PIV.y + LEN}
          r="16"
          className="art-c"
          style={{ opacity: 0 }}
        />
      ))}
      <line ref={rodRef} className="art-ink" x1={PIV.x} y1={PIV.y} x2={PIV.x} y2={PIV.y + LEN} />
      <circle ref={bobRef} className="art-c art-tint" cx={PIV.x} cy={PIV.y + LEN} r="16" style={{ strokeWidth: 1.5 }} />
      <circle className="art-dot" cx={PIV.x} cy={PIV.y} r="3.5" />
      <g className="appear" style={dl(1300)}>
        <line ref={vRef} className="art-c" style={{ strokeWidth: 1.4 }} markerEnd="url(#arrow-phy)" />
        <line ref={fRef} className="art-ink" style={{ strokeWidth: 1.1 }} markerEnd="url(#arrow-ink)" />
        <text ref={vLabel} className="art-label art-formula" style={{ fill: "var(--c)" }}>
          v
        </text>
        <text ref={fLabel} className="art-label art-formula">
          F
        </text>
      </g>
      <defs>
        <marker id="arrow-phy" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10" fill="none" stroke="var(--c)" strokeWidth="1.5" />
        </marker>
        <marker id="arrow-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10" fill="none" stroke="var(--page-fg)" strokeWidth="1.5" />
        </marker>
      </defs>

      {/* graph */}
      <line className="art-ink draw art-thin" pathLength={1} style={dl(500, 800)} x1={GRAPH.x0} y1={GRAPH.y} x2={GRAPH.x1 + 10} y2={GRAPH.y} />
      <line className="art-ink draw art-thin" pathLength={1} style={dl(600, 600)} x1={GRAPH.x0} y1={GRAPH.y + 60} x2={GRAPH.x0} y2={GRAPH.y - 64} />
      <text className="art-label art-formula appear" style={dl(900)} x={GRAPH.x1 - 6} y={GRAPH.y + 22}>t</text>
      <text className="art-label art-formula appear" style={dl(900)} x={GRAPH.x0 + 8} y={GRAPH.y - 54}>x</text>
      <polyline ref={traceRef} className="art-c" points="" />
      <circle ref={penRef} className="art-dot-c" cx={GRAPH.x0} cy={GRAPH.y} r="3.5" />
      <text className="art-label art-formula appear" style={{ ...dl(1100), fill: "var(--page-fg-2)" }} x="420" y="110">x = A cos(ωt)</text>
      <text className="art-label art-formula appear" style={{ ...dl(1200), fill: "var(--page-fg-2)" }} x="420" y="130">T = 2π√(L/g)</text>
    </svg>
  );
}

/* ─────────────── Math: axes draw, y = sin x plots, a tangent slides along it ─────────────── */
const O = { x: 60, y: 230 };
const KX = 520 / (2 * Math.PI);
const KY = 120;
const sinPath = (() => {
  let d = "";
  for (let i = 0; i <= 120; i++) {
    const x = (2 * Math.PI * i) / 120;
    d += `${i ? "L" : "M"}${(O.x + x * KX).toFixed(1)} ${(O.y - Math.sin(x) * KY).toFixed(1)} `;
  }
  return d;
})();

export function MathDrawing({ active }: { active: boolean }) {
  const lineRef = useRef<SVGLineElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<SVGTextElement>(null);
  const tRef = useRef(0.6);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const place = (x: number) => {
      const y = Math.sin(x);
      const m = Math.cos(x);
      const px = O.x + x * KX;
      const py = O.y - y * KY;
      // tangent direction in screen space
      const dx = KX;
      const dy = -m * KY;
      const len = Math.hypot(dx, dy);
      const ux = (dx / len) * 90;
      const uy = (dy / len) * 90;
      lineRef.current?.setAttribute("x1", (px - ux).toFixed(1));
      lineRef.current?.setAttribute("y1", (py - uy).toFixed(1));
      lineRef.current?.setAttribute("x2", (px + ux).toFixed(1));
      lineRef.current?.setAttribute("y2", (py + uy).toFixed(1));
      dotRef.current?.setAttribute("cx", px.toFixed(1));
      dotRef.current?.setAttribute("cy", py.toFixed(1));
      if (labelRef.current) labelRef.current.textContent = `slope = cos x = ${m >= 0 ? " " : ""}${m.toFixed(2)}`;
    };
    if (reduced || !active) {
      place(Math.PI / 4);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const t0 = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (now - t0 > 1800) tRef.current += dt * 0.35;
      // ease back and forth across 0 … 2π
      const phase = (Math.sin(tRef.current - Math.PI / 2) + 1) / 2;
      place(0.15 + phase * (2 * Math.PI - 0.3));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <svg viewBox="0 0 680 520" role="img" aria-label="Coordinate axes with the curve y equals sine x, and a tangent line sliding along it showing its slope, cosine x.">
      <line className="art-ink draw" pathLength={1} style={dl(0, 700)} x1="40" y1={O.y} x2="620" y2={O.y} />
      <line className="art-ink draw" pathLength={1} style={dl(150, 600)} x1={O.x} y1="440" x2={O.x} y2="60" />
      <path className="art-ink" d={`M612 ${O.y - 5} L 620 ${O.y} L 612 ${O.y + 5}`} />
      <path className="art-ink" d={`M${O.x - 5} 68 L ${O.x} 60 L ${O.x + 5} 68`} />
      {[0.5, 1, 1.5, 2].map((k) => (
        <g key={k}>
          <line className="art-ink draw art-thin" pathLength={1} style={dl(500 + k * 100, 200)} x1={O.x + k * Math.PI * KX} y1={O.y - 5} x2={O.x + k * Math.PI * KX} y2={O.y + 5} />
          <text className="art-label art-formula appear" style={dl(700 + k * 100)} x={O.x + k * Math.PI * KX - 10} y={O.y + 24}>
            {k === 0.5 ? "π/2" : k === 1 ? "π" : k === 1.5 ? "3π/2" : "2π"}
          </text>
        </g>
      ))}
      <text className="art-label appear" style={dl(700)} x={O.x - 22} y={O.y - KY + 4}>1</text>
      <text className="art-label appear" style={dl(700)} x={O.x - 28} y={O.y + KY + 4}>−1</text>
      <line className="art-ink art-thin" x1={O.x} y1={O.y - KY} x2="600" y2={O.y - KY} strokeDasharray="2 6" opacity="0.4" />
      <line className="art-ink art-thin" x1={O.x} y1={O.y + KY} x2="600" y2={O.y + KY} strokeDasharray="2 6" opacity="0.4" />
      <path className="art-c draw" pathLength={1} style={{ ...dl(800, 1600), strokeWidth: 1.6 }} d={sinPath} />
      <text className="art-label art-formula appear" style={{ ...dl(2200), fill: "var(--c)" }} x="430" y="100">y = sin x</text>
      <g className="appear" style={dl(2000)}>
        <line ref={lineRef} className="art-ink" />
        <circle ref={dotRef} className="art-dot-c" r="5" />
        <text ref={labelRef} className="art-label art-formula" x="420" y="470">
          slope = cos x
        </text>
      </g>
    </svg>
  );
}
