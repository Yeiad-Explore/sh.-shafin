"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PlateHeader, Arrow } from "./bits";
import { useSite } from "./SiteProvider";
import { BiologyDrawing, ChemistryDrawing, MathDrawing, PhysicsDrawing } from "./drawings";
import { SUBJECT_VAR, pad2 } from "@/lib/format";
import type { Subject } from "@/lib/types";

function Stamp() {
  return (
    <svg viewBox="0 0 100 100" className="splate__stamp" role="img" aria-label="Specialty">
      <defs>
        <path id="stamp-circle" d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0" />
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="1" />
      <text style={{ fontFamily: "var(--font-mono-stack)", fontSize: 8.5 }} fill="currentColor">
        <textPath href="#stamp-circle" textLength="224" lengthAdjust="spacing">
          SPECIALTY · BOTANY · SPECIALTY · BOTANY ·
        </textPath>
      </text>
      <path d="M40 58 C 42 46, 50 40, 62 38 C 60 50, 52 57, 40 58 Z M40 58 L 55 45" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Plate({ subject, index, total, active }: { subject: Subject; index: number; total: number; active: boolean }) {
  const { showSubjectCourses, data } = useSite();
  const hasCourses = data.courses.some((c) => c.subject_id === subject.id);
  const art =
    subject.slug === "biology" ? (
      <BiologyDrawing />
    ) : subject.slug === "chemistry" ? (
      <ChemistryDrawing />
    ) : subject.slug === "physics" ? (
      <PhysicsDrawing active={active} />
    ) : (
      <MathDrawing active={active} />
    );

  return (
    <article
      className={`splate splate--${subject.slug}`}
      style={{ "--c": SUBJECT_VAR[subject.slug] } as CSSProperties}
      data-subject={subject.slug}
      aria-labelledby={`subj-${subject.slug}`}
    >
      {subject.is_specialty && <Stamp />}
      <div className="splate__art">
        {art}
      </div>
      <div className="splate__text">
        <div className="splate__num t-label">
          {pad2(index + 1)} / {pad2(total)} · Module {String.fromCharCode(65 + index)}
        </div>
        <h3 id={`subj-${subject.slug}`} className="splate__name t-display t-h2">
          {subject.name}
        </h3>
        {subject.tagline && <p className="splate__tagline">{subject.tagline}</p>}
        <div className="splate__levels">
          <div>
            <h4 className="t-label">Class 9–10 · SSC</h4>
            <ul>
              {subject.topics_ssc.slice(0, 7).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="t-label">Class 11–12 · HSC</h4>
            <ul>
              {subject.topics_hsc.slice(0, 7).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
        {hasCourses && (
          <button type="button" className="splate__link t-label link-draw" onClick={() => showSubjectCourses(subject.slug)}>
            <span className="swatch" aria-hidden="true" />
            See {subject.name} courses <Arrow />
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * PL. 03 — on desktop the section pins and scrolls sideways through four full-screen plates while the
 * growth line splits into four coloured branches. On phones (and with reduced motion) the plates stack.
 */
export default function Subjects({ n }: { n: number }) {
  const { data } = useSite();
  const subjects = data.subjects;
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<SVGSVGElement>(null);
  const [horizontal, setHorizontal] = useState(false);
  const [index, setIndex] = useState(0);
  const [activeSet, setActiveSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      {
        wide: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        narrow: "(max-width: 1023px), (prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { wide } = ctx.conditions as { wide: boolean; narrow: boolean };
        const plates = Array.from(trackRef.current?.querySelectorAll<HTMLElement>(".splate") ?? []);
        if (wide !== horizontal) {
          // switch layout first; this effect re-runs once the DOM matches
          setHorizontal(wide);
          return;
        }

        if (!wide) {
          // Stacked: each drawing plays once on entry; loops run only while visible.
          const io = new IntersectionObserver(
            (entries) => {
              for (const e of entries) {
                const slug = (e.target as HTMLElement).dataset.subject!;
                if (e.isIntersecting) {
                  e.target.classList.add("is-in");
                  document.documentElement.style.setProperty("--accent-current", SUBJECT_VAR[slug as Subject["slug"]]);
                }
                setActiveSet((prev) => {
                  const next = new Set(prev);
                  if (e.isIntersecting) next.add(slug);
                  else next.delete(slug);
                  return next;
                });
              }
            },
            { rootMargin: "0px 0px -20% 0px" },
          );
          plates.forEach((p) => io.observe(p));
          return () => io.disconnect();
        }

        const track = trackRef.current!;
        const pin = pinRef.current!;
        const distance = () => track.scrollWidth - window.innerWidth;
        const svg = branchRef.current;
        const branches = Array.from(svg?.querySelectorAll<SVGPathElement>("path") ?? []);
        let progress = 0;
        let started = false;
        const paintBranches = () => {
          branches.forEach((b, bi) => {
            const local = bi === 0 ? (started ? 1 : 0) : Math.min(1, Math.max(0, progress * (plates.length - 1) - bi + 1.1));
            b.style.strokeDashoffset = String(1 - local);
          });
        };
        // Four branches fan out from the stem, run along the top, and turn down into their own plate.
        const layoutBranches = () => {
          if (!svg) return;
          const W = track.scrollWidth;
          const H = pin.offsetHeight;
          const vw = window.innerWidth;
          const navH = vw < 768 ? 60 : 72;
          svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
          svg.style.width = `${W}px`;
          branches.forEach((b, i) => {
            const y = navH + 10 + i * 7;
            const x = i * vw + vw * 0.035;
            const down = H - 56;
            const d =
              i === 0
                ? `M${x},${navH - 10} C${x},${navH + 40} ${x},${navH + 40} ${x},${down}`
                : `M${vw * 0.035},${navH - 10} C${vw * 0.035},${y} ${vw * 0.12},${y} ${vw * 0.2},${y} L${x - 60},${y} C${x - 10},${y} ${x},${y + 30} ${x},${y + 80} L${x},${down}`;
            b.setAttribute("d", d);
            b.setAttribute("pathLength", "1");
            b.style.strokeDasharray = "1 1";
          });
          paintBranches();
        };
        layoutBranches();
        ScrollTrigger.addEventListener("refresh", layoutBranches);
        // triggers further down the page (paper → slate) were created before this pin existed
        requestAnimationFrame(() => {
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        });

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: () => `+=${Math.max(distance(), window.innerHeight * 3)}`,
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate(self) {
              const i = Math.min(plates.length - 1, Math.round(self.progress * (plates.length - 1)));
              setIndex(i);
              const slug = plates[i]?.dataset.subject as Subject["slug"] | undefined;
              if (slug) document.documentElement.style.setProperty("--accent-current", SUBJECT_VAR[slug]);
              progress = self.progress;
              paintBranches();
            },
          },
        });

        const triggers = plates.map((plate) =>
          ScrollTrigger.create({
            trigger: plate,
            containerAnimation: tween,
            start: "left 92%",
            end: "right 30%",
            onToggle: (self) => {
              if (self.isActive) plate.classList.add("is-in");
              const slug = plate.dataset.subject!;
              setActiveSet((prev) => {
                const next = new Set(prev);
                if (self.isActive) next.add(slug);
                else next.delete(slug);
                return next;
              });
            },
          }),
        );
        // the first plate is visible as soon as the pin starts
        const first = ScrollTrigger.create({
          trigger: pin,
          start: "top 60%",
          onEnter: () => {
            plates[0]?.classList.add("is-in");
            started = true;
            paintBranches();
          },
        });

        return () => {
          ScrollTrigger.removeEventListener("refresh", layoutBranches);
          triggers.forEach((t) => t.kill());
          first.kill();
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { clearProps: "transform" });
        };
      },
    );
    return () => mm.revert();
  }, [subjects.length, horizontal]);

  if (!subjects.length) return null;

  return (
    <section id="subjects" ref={sectionRef} className={`subjects ${horizontal ? "" : "subjects--stack"}`} aria-labelledby="subjects-title">
      <div className="wrap">
        <PlateHeader n={n} label="Subjects" id="subjects-title" title="Four subjects, one way of thinking" />
      </div>
      <div ref={pinRef} className="subjects__pin">
        <div className="subjects__counter t-label" aria-hidden="true">
          <span style={{ color: SUBJECT_VAR[subjects[index]?.slug ?? "biology"] }}>●</span>
          {index + 1} / {subjects.length}
        </div>
        <div ref={trackRef} className="subjects__track">
          <svg ref={branchRef} className="subjects__branches" aria-hidden="true" style={{ height: "100%" }}>
            {subjects.map((s, i) => (
              <path
                key={s.slug}
                style={{ stroke: SUBJECT_VAR[s.slug], strokeDashoffset: 1, transition: i === 0 ? "stroke-dashoffset 1400ms var(--ease-ink)" : "stroke-dashoffset 120ms linear" }}
              />
            ))}
          </svg>
          {subjects.map((s, i) => (
            <Plate key={s.id} subject={s} index={i} total={subjects.length} active={activeSet.has(s.slug)} />
          ))}
        </div>
      </div>
      <span data-growth="point" data-gx="left" data-gdx="40" style={{ display: "block", height: 1 }} aria-hidden="true" />
    </section>
  );
}
