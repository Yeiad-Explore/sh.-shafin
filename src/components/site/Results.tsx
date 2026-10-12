"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { PlateHeader, tilt } from "./bits";
import { useSite } from "./SiteProvider";
import { seatsLeft } from "@/lib/format";
import { EASE_OUT } from "@/lib/motion";
import { useYear } from "@/lib/hooks";

/** Counts up from zero once it scrolls into view. The real number is in the markup for no-JS and screen readers. */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (el && !reduce && !inView) el.textContent = "0";
  }, [reduce, inView]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce) return;
    const controls = animate(0, value, {
      duration: 0.8,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden="true">
        {value}
      </span>
    </>
  );
}

interface Stat {
  key: string;
  value: number;
  suffix?: string | null;
  label: string;
  note?: string;
}

export default function Results() {
  const { data } = useSite();
  const { results, testimonials, experience, subjects, courses, batches } = data;

  const year = useYear();
  // Only numbers the site actually holds: published results first, then counts from the live data.
  const since = experience.length ? Math.min(...experience.map((e) => e.start_year)) : null;
  const stats: Stat[] = [
    ...results.map((r) => ({ key: r.id, value: r.value, suffix: r.suffix, label: r.label, note: `${r.exam} · ${r.year}` })),
    ...(since ? [{ key: "years", value: Math.max(1, year - since), label: "Years teaching", note: `Since ${since}` }] : []),
    ...(subjects.length ? [{ key: "subjects", value: subjects.length, label: "Subjects", note: "SSC & HSC" }] : []),
    ...(courses.length ? [{ key: "courses", value: courses.length, label: "Courses" }] : []),
    ...(batches.length ? [{ key: "batches", value: batches.length, label: "Weekly batches" }] : []),
    ...(batches.length ? [{ key: "seats", value: batches.reduce((n, b) => n + seatsLeft(b), 0), label: "Seats open now" }] : []),
  ];
  const trackRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const measure = () => {
      const t = trackRef.current;
      const v = viewRef.current;
      if (!t || !v) return;
      const pad = parseFloat(getComputedStyle(v).paddingLeft) * 2;
      setLimit(Math.max(0, t.scrollWidth - v.clientWidth + pad));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [testimonials.length]);

  return (
    <section id="results" className="plate results" aria-labelledby="results-title">
      <div className="wrap">
        <PlateHeader label="Results" id="results-title" title="What students say" />

        {stats.length > 0 && (
          <dl className="stats">
            {stats.map((st, i) => (
              <motion.div
                key={st.key}
                className="stats__item"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 0.5, ease: EASE_OUT, delay: i * 0.07 }}
              >
                <dt className="t-label">{st.label}</dt>
                <dd className="stats__num">
                  <CountUp value={st.value} />
                  {st.suffix && <span className="stats__suffix">{st.suffix}</span>}
                </dd>
                {st.note && <dd className="stats__note t-label">{st.note}</dd>}
              </motion.div>
            ))}
          </dl>
        )}

        {testimonials.length > 0 ? (
          <div ref={viewRef} className="notes" data-lenis-prevent-touch="">
            <motion.div
              ref={trackRef}
              className="notes__track"
              drag={limit > 0 ? "x" : false}
              dragConstraints={{ left: -limit, right: 0 }}
              dragElastic={0.08}
              dragTransition={{ power: reduce ? 0 : 0.3, timeConstant: 260 }}
            >
              {testimonials.map((t, i) => (
                <figure key={t.id} className="note" tabIndex={0} style={{ "--rot": tilt(i + 2, 2) } as CSSProperties}>
                  <blockquote className="note__quote">“{t.quote}”</blockquote>
                  <figcaption className="note__who">
                    {t.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photo_url} alt="" loading="lazy" />
                    )}
                    <div>
                      <div style={{ fontWeight: 500 }}>{t.name}</div>
                      <div className="t-label" style={{ color: "var(--page-fg-2)" }}>
                        {t.role === "parent" ? "Parent" : "Student"}
                        {t.class_label ? ` · ${t.class_label}` : ""}
                      </div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </motion.div>
            {limit > 0 && (
              <p className="t-label muted" style={{ marginTop: 18 }} aria-hidden="true">
                ← Drag to read more →
              </p>
            )}
          </div>
        ) : (
          <div className="empty-note" data-reveal="fade">
            <p className="t-label" style={{ color: "var(--page-fg-2)", margin: "0 0 10px" }}>
              Notes being collected
            </p>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.25rem", lineHeight: 1.3 }}>
              Words from students and parents appear here once they&apos;ve agreed to share them. Until then, the best review is a free class — come and see for yourself.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
