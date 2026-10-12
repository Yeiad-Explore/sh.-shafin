"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Arrow } from "./bits";
import Scramble from "./Scramble";
import { useSite } from "./SiteProvider";
import { prefersReducedMotion, whenReady } from "@/lib/motion";

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

export default function Hero() {
  const { data } = useSite();
  const { settings, education, experience, subjects } = data;
  const rootRef = useRef<HTMLElement>(null);

  const teachingSince = experience.length ? Math.min(...experience.map((e) => e.start_year)) : 2022;
  const degree = education[0];
  const degreeLine = degree ? `${short(degree.degree)}${degree.concentration ? ` ${degree.concentration}` : ""}, ${degree.institution}` : null;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = prefersReducedMotion();
    const lines = root.querySelectorAll<HTMLElement>(".hero__line-inner");
    const photo = root.querySelector(".hero__photo-frame");
    const leaders = root.querySelector(".hero__leaders");
    const copy = root.querySelectorAll<HTMLElement>(".hero__copy-item");
    const seed = root.querySelector(".hero__seed");
    const timers: ReturnType<typeof setTimeout>[] = [];

    gsap.set(lines, { y: 0, yPercent: reduced ? 0 : 110 });
    gsap.set(copy, { opacity: 0, y: reduced ? 0 : 16 });

    const stop = whenReady(() => {
      if (reduced) {
        gsap.to(lines, { opacity: 1, duration: 0.2 });
        photo?.classList.add("is-in");
        leaders?.classList.add("is-in");
        gsap.to(copy, { opacity: 1, duration: 0.2 });
        seed?.classList.add("is-in");
        return;
      }
      gsap.to(lines, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.045 });
      timers.push(setTimeout(() => photo?.classList.add("is-in"), 300));
      timers.push(setTimeout(() => leaders?.classList.add("is-in"), 900));
      gsap.to(copy, { opacity: 1, y: 0, duration: 0.48, ease: "power3.out", stagger: 0.06, delay: 1.2 });
      timers.push(setTimeout(() => seed?.classList.add("is-in"), 1300));
    });

    // Scrolling out: the name settles back and drifts up slightly faster than the page.
    let st: ScrollTrigger | undefined;
    if (!reduced) {
      const tween = gsap.to(root.querySelector(".hero__name"), {
        scale: 0.92,
        yPercent: -14,
        transformOrigin: "left top",
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
      });
      st = tween.scrollTrigger;
    }

    return () => {
      stop();
      timers.forEach(clearTimeout);
      st?.kill();
    };
  }, []);

  const ticker = [
    `Teaching since ${teachingSince}`,
    "SSC & HSC",
    ...subjects.map((x) => x.name),
    ...(degreeLine ? [degreeLine] : []),
    "Free trial class",
    "National curriculum",
  ];

  return (
    <section id="home" ref={rootRef} className="hero" aria-labelledby="hero-name">
      <div className="hero__floor" aria-hidden="true" />
      <div className="wrap">
        <div className="hero__grid">
          <div className="hero__main">
            <p className="hero__kicker hero__copy-item t-label">
              <span className="hero__pulse" aria-hidden="true" />
              <Scramble text={`Science teacher · Dhaka · Since ${teachingSince}`} delay={1250} />
            </p>
            <h1 id="hero-name" className="hero__name t-display t-hero" aria-label="Samiul Haque Shafin">
              {["Samiul", "Haque", "Shafin"].map((w, i) => (
                <span key={w} className="split-mask" aria-hidden="true">
                  <span className={`hero__line-inner ${i === 2 ? "hero__name-glow" : ""}`}>{w}</span>
                </span>
              ))}
            </h1>

            <div className="hero__copy">
              <p className="hero__headline hero__copy-item">{settings.hero_headline}</p>
              <p className="hero__sub hero__copy-item">{settings.hero_subline}</p>
              <div className="hero__ctas hero__copy-item">
                <a href={data.trialSlots.length ? "#schedule" : "#contact"} className="btn btn--ink">
                  Book a free trial <Arrow />
                </a>
                <a href="#courses" className="btn btn--ghost">
                  See courses
                </a>
              </div>
              <div className="hero__seed-row">
                <span className="hero__seed" data-growth="seed" data-gx="center" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="hero__photo">
            <div className="hero__orbit" aria-hidden="true">
              <span />
              <span />
              <i />
            </div>
            <figure className="holo hero__photo-frame">
              <div className="specimen__media holo__media">
                {settings.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.photo_url} alt="Portrait of Samiul Haque Shafin" width={800} height={1000} fetchPriority="high" style={{ objectPosition: "50% 20%" }} />
                ) : (
                  <PressedSpecimen />
                )}
              </div>
              <span className="holo__scan" aria-hidden="true" />
              <span className="holo__corner holo__corner--tl" aria-hidden="true" />
              <span className="holo__corner holo__corner--tr" aria-hidden="true" />
              <span className="holo__corner holo__corner--bl" aria-hidden="true" />
              <span className="holo__corner holo__corner--br" aria-hidden="true" />
              <figcaption className="holo__label t-label">
                <span>ID · SHS-{teachingSince}</span>
                <span>Science teacher · Dhaka</span>
              </figcaption>
            </figure>
            <ul className="hero__leaders" aria-label="At a glance">
              {degreeLine && (
                <li className="hud-chip" style={{ "--delay": "0ms" } as CSSProperties}>
                  <i aria-hidden="true" />
                  {degreeLine.replace(",", " —")}
                </li>
              )}
              <li className="hud-chip" style={{ "--delay": "120ms" } as CSSProperties}>
                <i aria-hidden="true" />
                Teaching since {teachingSince}
              </li>
              <li className="hud-chip" style={{ "--delay": "240ms" } as CSSProperties}>
                <i aria-hidden="true" />
                SSC · HSC · National curriculum
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="marquee hero__copy-item" aria-hidden="true">
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
      </div>
    </section>
  );
}
