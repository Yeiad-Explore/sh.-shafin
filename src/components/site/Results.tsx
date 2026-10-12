"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PlateHeader, LeafGlyph, tilt } from "./bits";
import { useSite } from "./SiteProvider";
import { useGrowthReach } from "@/lib/growth";
import type { Result } from "@/lib/types";

function Odometer({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [run, setRun] = useState(false);
  const digits = String(value).split("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} aria-label={String(value)} role="img" style={{ display: "inline-flex" }}>
      {digits.map((d, i) => (
        <span className="odo" key={i} aria-hidden="true">
          <span
            className="odo__col"
            style={{ transform: `translateY(-${run ? Number(d) : 0}em)`, "--delay": `${i * 90}ms` } as CSSProperties}
          >
            {Array.from({ length: 10 }, (_, k) => (
              <span key={k}>{k}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

function Readout({ r }: { r: Result }) {
  const [leaf, setLeaf] = useState(false);
  const ref = useGrowthReach<HTMLDivElement>(() => setLeaf(true));
  return (
    <div ref={ref} className="readout" data-reveal="fade">
      <LeafGlyph className={`readout__leaf ${leaf ? "is-in" : ""}`} />
      <div className="readout__num">
        <Odometer value={r.value} />
        {r.suffix && <span style={{ fontSize: "0.5em", marginLeft: 4 }}>{r.suffix}</span>}
      </div>
      <div style={{ marginTop: 10 }}>{r.label}</div>
      <div className="t-label muted">
        {r.exam} · {r.year}
      </div>
    </div>
  );
}

export default function Results({ n }: { n: number }) {
  const { data } = useSite();
  const { results, testimonials } = data;
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
        <PlateHeader n={n} label="Results" id="results-title" title="What students say" />

        {results.length > 0 && (
          <div className="readouts">
            {results.map((r) => (
              <Readout key={r.id} r={r} />
            ))}
          </div>
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
        <span data-growth="point" data-gx="left" data-gdx="-28" style={{ display: "block", height: 1, marginTop: 40 }} aria-hidden="true" />
      </div>
    </section>
  );
}
