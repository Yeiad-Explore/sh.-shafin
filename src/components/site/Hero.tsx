"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type Variants } from "motion/react";
import { Arrow } from "./bits";
import { useSite } from "./SiteProvider";
import { EASE_OUT, whenReady } from "@/lib/motion";

const short = (deg: string) =>
  deg
    .replace("Bachelor of Science", "B.Sc.")
    .replace("Master of Science", "M.Sc.")
    .replace("Higher Secondary Certificate", "HSC")
    .replace("Secondary School Certificate", "SSC");

/** A line-drawn plant specimen, shown until a real portrait is uploaded in /admin. */
function PressedSpecimen() {
  const d = (ms: number) => ({ "--delay": `${ms}ms`, "--dur": "1100ms" }) as CSSProperties;
  return (
    <svg viewBox="0 0 320 400" role="img" aria-label="Ink drawing of a pressed plant specimen on herbarium paper">
      <rect x="0" y="0" width="320" height="400" fill="var(--page-bg)" />
      <g className="art-ink" style={{ stroke: "var(--page-fg)" }}>
        <path className="draw" pathLength={1} style={d(0)} d="M168 372 C 164 300, 172 230, 160 160 C 152 112, 162 78, 176 46" />
        <path className="draw" pathLength={1} style={d(250)} d="M166 318 C 130 310, 98 286, 84 250 C 120 250, 150 276, 166 318 Z" />
        <path className="draw" pathLength={1} style={d(300)} d="M166 318 L 100 258" strokeWidth="0.8" />
        <path className="draw" pathLength={1} style={d(400)} d="M167 266 C 200 250, 232 222, 244 186 C 208 190, 180 220, 167 266 Z" />
        <path className="draw" pathLength={1} style={d(450)} d="M167 266 L 236 194" strokeWidth="0.8" />
        <path className="draw" pathLength={1} style={d(550)} d="M161 206 C 128 196, 104 172, 96 140 C 128 144, 152 170, 161 206 Z" />
        <path className="draw" pathLength={1} style={d(600)} d="M161 206 L 104 148" strokeWidth="0.8" />
        <path className="draw" pathLength={1} style={d(700)} d="M158 146 C 184 132, 204 110, 210 84 C 184 90, 164 112, 158 146 Z" />
        <path className="draw" pathLength={1} style={d(750)} d="M158 146 L 204 92" strokeWidth="0.8" />
        <circle className="draw" pathLength={1} style={d(850)} cx="178" cy="40" r="9" />
        <path className="draw" pathLength={1} style={d(950)} d="M178 31 C 172 18, 184 12, 182 26 M187 40 C 200 36, 202 48, 188 45 M178 49 C 184 62, 172 64, 174 50 M169 40 C 156 44, 154 32, 168 35" />
        <path className="draw" pathLength={1} style={d(1000)} d="M168 372 C 160 380, 150 384, 140 382 M168 372 C 176 382, 188 386, 198 384 M168 372 C 168 382, 166 390, 162 396" strokeWidth="0.8" />
      </g>
      <g className="appear" style={{ "--delay": "1200ms" } as CSSProperties}>
        <rect x="196" y="318" width="108" height="66" fill="none" stroke="var(--page-fg)" strokeWidth="0.8" />
        <text x="204" y="336" className="art-label" style={{ fill: "var(--page-fg)", fontSize: 8 }}>HERBARIUM</text>
        <text x="204" y="352" className="art-label" style={{ fill: "var(--page-fg-2)", fontSize: 7 }}>DHAKA COLLEGE</text>
        <text x="204" y="366" className="art-label" style={{ fill: "var(--page-fg-2)", fontSize: 7 }}>DEPT. OF BOTANY</text>
        <text x="204" y="378" className="art-label" style={{ fill: "var(--page-fg-2)", fontSize: 7 }}>COLL. S.H. SHAFIN</text>
      </g>
    </svg>
  );
}

/** The main CTA leans a few pixels towards the pointer. Mouse only, and still with reduced motion. */
function MagneticCta({ href, children }: { href: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 180, damping: 18, mass: 0.5 });
  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.16);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.22);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.a href={href} className="btn btn--ink" style={reduce ? undefined : { x: sx, y: sy }} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </motion.a>
  );
}

const pillList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.62 } },
};
const pillItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export default function Hero() {
  const { data } = useSite();
  const { settings, education, experience, subjects } = data;
  const rootRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => whenReady(() => setReady(true)), []);

  // Scrolling out: the name drifts up, the portrait lags behind and the copy fades.
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start start", "end start"] });
  const nameY = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const teachingSince = experience.length ? Math.min(...experience.map((e) => e.start_year)) : 2022;
  const degree = education[0];
  const degreeLine = degree ? `${short(degree.degree)}${degree.concentration ? ` ${degree.concentration}` : ""}, ${degree.institution}` : null;
  const stats = [degreeLine?.replace(",", " —"), `Teaching since ${teachingSince}`, "SSC · HSC · National curriculum"].filter(Boolean) as string[];
  const ticker = [
    `Teaching since ${teachingSince}`,
    "SSC & HSC",
    ...subjects.map((x) => x.name),
    ...(degreeLine ? [degreeLine] : []),
    "Free trial class",
    "National curriculum",
  ];

  // The entrance waits for the first-visit preloader; with reduced motion everything starts in place.
  const on = ready || !!reduce;
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: on ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.6, ease: EASE_OUT, delay },
  });
  const reveal = { duration: 0.8, ease: EASE_OUT, delay: 0.28 };

  return (
    <section id="home" ref={rootRef} className="hero" aria-labelledby="hero-name">
      <div className="hero__floor" aria-hidden="true" />
      <div className="wrap">
        <div className="hero__grid">
          <div className="hero__main">
            <motion.p className="hero__kicker t-label" {...rise(0.05)}>
              <span className="hero__pulse" aria-hidden="true" />
              Science teacher · Dhaka · Since {teachingSince}
            </motion.p>
            <motion.h1 id="hero-name" className="hero__name t-display t-hero" aria-label="Samiul Haque Shafin" style={reduce ? undefined : { y: nameY }}>
              {["Samiul", "Haque", "Shafin"].map((w, i) => (
                <span key={w} className="split-mask" aria-hidden="true">
                  <motion.span
                    className={`hero__line-inner ${i === 2 ? "hero__name-glow" : ""}`}
                    initial={reduce ? false : { y: "110%" }}
                    animate={on ? { y: "0%" } : undefined}
                    transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.12 + i * 0.08 }}
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </motion.h1>

            <motion.div className="hero__copy" style={reduce ? undefined : { opacity: fade }}>
              <motion.p className="hero__headline" {...rise(0.42)}>
                {settings.hero_headline}
              </motion.p>
              <motion.p className="hero__sub" {...rise(0.5)}>
                {settings.hero_subline}
              </motion.p>
              <motion.ul className="hero__stats" aria-label="At a glance" variants={pillList} initial={reduce ? false : "hidden"} animate={on ? "show" : undefined}>
                {stats.map((t) => (
                  <motion.li key={t} className="stat-pill t-label" variants={pillItem}>
                    {t}
                  </motion.li>
                ))}
              </motion.ul>
              <motion.div className="hero__ctas" {...rise(0.82)}>
                <MagneticCta href={data.trialSlots.length ? "#schedule" : "#contact"}>
                  Book a free trial <Arrow />
                </MagneticCta>
                <a href="#courses" className="btn btn--ghost">
                  See courses
                </a>
              </motion.div>
              <div className="hero__seed-row">
                <motion.span
                  className="hero__seed"
                  data-growth="seed"
                  data-gx="center"
                  aria-hidden="true"
                  initial={reduce ? false : { scale: 0 }}
                  animate={on ? { scale: 1 } : undefined}
                  transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.95 }}
                />
              </div>
            </motion.div>
          </div>

          <motion.div className="hero__photo" style={reduce ? undefined : { y: photoY }}>
            <div className="hero__orbit" aria-hidden="true">
              <span />
              <span />
              <i />
            </div>
            <figure className={`holo ${on ? "is-in" : ""}`}>
              <motion.div
                className="holo__media"
                initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
                animate={on ? { clipPath: "inset(0% 0% 0% 0%)" } : undefined}
                transition={reveal}
              >
                <motion.div className="holo__img" initial={reduce ? false : { scale: 1.12 }} animate={on ? { scale: 1 } : undefined} transition={reveal}>
                  {settings.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.photo_url} alt="Portrait of Samiul Haque Shafin" width={800} height={1000} fetchPriority="high" style={{ objectPosition: "50% 20%" }} />
                  ) : (
                    <PressedSpecimen />
                  )}
                </motion.div>
              </motion.div>
              <span className="holo__scan" aria-hidden="true" />
              <span className="holo__corner holo__corner--tl" aria-hidden="true" />
              <span className="holo__corner holo__corner--tr" aria-hidden="true" />
              <span className="holo__corner holo__corner--bl" aria-hidden="true" />
              <span className="holo__corner holo__corner--br" aria-hidden="true" />
            </figure>
          </motion.div>
        </div>
      </div>

      <motion.div className="marquee" aria-hidden="true" {...rise(0.9)}>
        <div className="marquee__track">
          {[0, 1].map((k) => (
            <span className="marquee__set" key={k}>
              {ticker.map((t) => (
                <span key={t} className="marquee__item">
                  {t}
                  <i>✦</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
