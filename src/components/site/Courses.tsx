"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PlateHeader, LeaderLabel, tilt } from "./bits";
import { useSite, type CourseFilter } from "./SiteProvider";
import {
  DAY_LONG,
  SUBJECT_VAR,
  classGroup,
  fmtClass,
  fmtDate,
  fmtFee,
  fmtMode,
  fmtTime,
  seatStatus,
  seatsLeft,
  STATUS_LABEL,
} from "@/lib/format";
import { getLenis } from "@/lib/motion";
import { useClientValue, useMounted } from "@/lib/hooks";
import type { Batch, Course } from "@/lib/types";

const SPRING = { type: "spring" as const, stiffness: 220, damping: 26 };

function SeatDots({ batch }: { batch: Batch }) {
  const total = Math.min(batch.seats_total, 24);
  const taken = Math.min(batch.seats_taken, total);
  return (
    <span className="seats" role="img" aria-label={`${seatsLeft(batch)} of ${batch.seats_total} seats left`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < taken ? "is-taken" : ""} />
      ))}
    </span>
  );
}

function bestBatch(batches: Batch[]): Batch | undefined {
  return [...batches].sort((a, b) => seatsLeft(b) - seatsLeft(a))[0];
}

function CourseCard({ course, batches, onDetails }: { course: Course; batches: Batch[]; onDetails: () => void }) {
  const { subjectById, enrollCourse } = useSite();
  const subject = course.subject_id ? subjectById.get(course.subject_id) : undefined;
  const b = bestBatch(batches);
  return (
    <article className="ccard" style={{ "--c": subject ? SUBJECT_VAR[subject.slug] : "var(--ink)" } as CSSProperties}>
      <span className="ccard__stripe" aria-hidden="true" />
      <span className="ccard__hint" aria-hidden="true">
        <LeaderLabel reverse length={36}>
          View details
        </LeaderLabel>
      </span>
      <div className="ccard__head">
        <h3 className="ccard__title">{course.title}</h3>
        <span className="ccard__subject t-label">
          <i aria-hidden="true" />
          {subject?.name ?? "All subjects"}
        </span>
      </div>
      <dl className="ccard__meta">
        <dt>Class</dt>
        <dd>{fmtClass(course.class_level)}</dd>
        <dt>Mode</dt>
        <dd>{fmtMode(course.mode)}</dd>
        {course.duration && (
          <>
            <dt>Length</dt>
            <dd>{course.duration}</dd>
          </>
        )}
        {b && (
          <>
            <dt>Batch</dt>
            <dd>
              {b.days.join(" · ")} · {fmtTime(b.start_time)}
            </dd>
          </>
        )}
        <dt>Fee</dt>
        <dd>{fmtFee(course.fee, course.fee_note)}</dd>
        {b && (
          <>
            <dt>Seats</dt>
            <dd style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <SeatDots batch={b} />
              <span>{seatsLeft(b) > 0 ? `${seatsLeft(b)} left` : STATUS_LABEL[seatStatus(b)]}</span>
            </dd>
          </>
        )}
      </dl>
      <div className="ccard__foot">
        <button type="button" className="btn btn--sm btn--card" onClick={onDetails} aria-haspopup="dialog">
          Details
        </button>
        <button type="button" className="btn btn--sm btn--card btn--ink" onClick={() => enrollCourse(course.id)}>
          Enroll
        </button>
      </div>
    </article>
  );
}

function SyllabusRow({ chapter, topics, i }: { chapter: string; topics: string[]; i: number }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <li className="syl__row">
      <button type="button" className="syl__btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>
          <span className="t-label muted" style={{ marginRight: 12 }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          {chapter}
        </span>
        <span className="plus" aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <motion.div className="syl__rule" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : 0.4, ease: [0.65, 0, 0.35, 1] }} />
            <ul className="syl__topics">
              {topics.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function CourseDrawer({ course, batches, onClose }: { course: Course; batches: Batch[]; onClose: () => void }) {
  const { subjectById, enrollCourse, data } = useSite();
  const subject = course.subject_id ? subjectById.get(course.subject_id) : undefined;
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const mobile = useClientValue(() => window.innerWidth < 768, false);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const lenis = getLenis();
    lenis?.stop();
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>(".drawer__close")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
      document.body.style.overflow = "";
      prev?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  const payments = data.settings.payment_methods;

  return (
    <>
      <motion.div
        className="drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.24 }}
        onClick={onClose}
      />
      <motion.div
        ref={ref}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        style={{ "--c": subject ? SUBJECT_VAR[subject.slug] : "var(--ink)" } as CSSProperties}
        initial={mobile ? { y: "100%" } : { x: "100%" }}
        animate={mobile ? { y: 0 } : { x: 0 }}
        exit={mobile ? { y: "100%" } : { x: "100%" }}
        transition={reduce ? { duration: 0 } : SPRING}
        drag={mobile ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 600) onClose();
        }}
        data-lenis-prevent=""
      >
        {mobile && <div className="drawer__grab" aria-hidden="true" />}
        <div className="drawer__top">
          <span className="t-label" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <i style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--c)", display: "inline-block" }} />
            {subject?.name ?? "All subjects"} · {fmtClass(course.class_level)}
          </span>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close details">
            ✕
          </button>
        </div>

        <h3 id="drawer-title">{course.title}</h3>
        {course.summary && <p style={{ margin: "0 0 8px" }}>{course.summary}</p>}
        <p className="t-label" style={{ color: "var(--graphite)", margin: "0 0 8px" }}>
          {fmtMode(course.mode)} {course.duration ? `· ${course.duration}` : ""}
        </p>

        {course.audience && (
          <section>
            <h4 className="t-label">Who it&apos;s for</h4>
            <p style={{ margin: 0 }}>{course.audience}</p>
          </section>
        )}

        {course.syllabus.length > 0 && (
          <section>
            <h4 className="t-label">Chapter-wise syllabus</h4>
            <ul>
              {course.syllabus.map((ch, i) => (
                <SyllabusRow key={ch.chapter} chapter={ch.chapter} topics={ch.topics} i={i} />
              ))}
            </ul>
          </section>
        )}

        {course.includes.length > 0 && (
          <section>
            <h4 className="t-label">What&apos;s included</h4>
            <ul className="includes">
              {course.includes.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h4 className="t-label">Batches</h4>
          {batches.length === 0 && <p style={{ margin: 0, color: "var(--graphite)" }}>New batch dates are announced soon — send a request to be told first.</p>}
          {batches.map((b) => {
            const st = seatStatus(b);
            return (
              <div className="batch-row" key={b.id}>
                <div>
                  <div style={{ fontWeight: 500 }}>{b.name}</div>
                  <div className="t-label" style={{ color: "var(--graphite)" }}>
                    {b.days.map((d) => DAY_LONG[d]?.slice(0, 3) ?? d).join(" · ")} · {fmtTime(b.start_time)}–{fmtTime(b.end_time)} · {fmtMode(b.mode)}
                    {b.start_date ? ` · starts ${fmtDate(b.start_date)}` : ""}
                  </div>
                </div>
                <span className={`badge badge--${st}`}>{STATUS_LABEL[st]}</span>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center" }}>
                  <SeatDots batch={b} />
                  <span className="t-label" style={{ color: "var(--graphite)" }}>
                    {seatsLeft(b)} of {b.seats_total} seats left
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <section>
          <h4 className="t-label">Fee</h4>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>{fmtFee(course.fee, course.fee_note)}</p>
          {payments.length > 0 && (
            <p className="t-label" style={{ color: "var(--graphite)", margin: "8px 0 0" }}>
              Pay by {payments.join(" · ")}
            </p>
          )}
        </section>

        {course.faqs.length > 0 && (
          <section>
            <h4 className="t-label">Course questions</h4>
            {course.faqs.map((f) => (
              <div key={f.q} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 500 }}>{f.q}</div>
                <div style={{ color: "var(--graphite)" }}>{f.a}</div>
              </div>
            ))}
          </section>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 24 }}>
          <button
            type="button"
            className="btn btn--card btn--ink"
            onClick={() => {
              onClose();
              setTimeout(() => enrollCourse(course.id), 280);
            }}
          >
            Enroll in this course →
          </button>
        </div>
      </motion.div>
    </>
  );
}

const CLS_OPTS: { v: CourseFilter["cls"]; label: string }[] = [
  { v: "all", label: "All" },
  { v: "9-10", label: "Class 9–10" },
  { v: "11-12", label: "Class 11–12" },
];
const MODE_OPTS: { v: CourseFilter["mode"]; label: string }[] = [
  { v: "all", label: "Any" },
  { v: "online", label: "Online" },
  { v: "offline", label: "Offline" },
];

export default function Courses({ n }: { n: number }) {
  const { data, filter, setFilter, subjectById } = useSite();
  const [openId, setOpenId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const batchesByCourse = useMemo(() => {
    const m = new Map<string, Batch[]>();
    data.batches.forEach((b) => m.set(b.course_id, [...(m.get(b.course_id) ?? []), b]));
    return m;
  }, [data.batches]);

  const visible = data.courses.filter((c) => {
    if (filter.cls !== "all" && classGroup(c.class_level) !== filter.cls) return false;
    if (filter.subject !== "all") {
      const s = c.subject_id ? subjectById.get(c.subject_id) : undefined;
      if (s?.slug !== filter.subject) return false;
    }
    if (filter.mode !== "all" && c.mode !== "both" && c.mode !== filter.mode) return false;
    return true;
  });

  const open = openId ? data.courses.find((c) => c.id === openId) : undefined;
  const close = useCallback(() => setOpenId(null), []);
  const mounted = useMounted();

  return (
    <section id="courses" className="plate courses" aria-labelledby="courses-title">
      <div className="wrap">
        <PlateHeader n={n} label="Courses" id="courses-title" title="Find your course" />

        <div className="filters" role="group" aria-label="Filter courses">
          <div className="filters__row">
            <span className="filters__label t-label">Class</span>
            {CLS_OPTS.map((o, i) => (
              <button key={o.v} type="button" className="tag" style={{ "--rot": tilt(i + 3, 1.2) } as CSSProperties} aria-pressed={filter.cls === o.v} onClick={() => setFilter({ cls: o.v })}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="filters__row">
            <span className="filters__label t-label">Subject</span>
            <button type="button" className="tag" style={{ "--rot": tilt(7, 1.2) } as CSSProperties} aria-pressed={filter.subject === "all"} onClick={() => setFilter({ subject: "all" })}>
              All
            </button>
            {data.subjects.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="tag"
                data-subject={s.slug}
                style={{ "--rot": tilt(i + 9, 1.2), "--tag-c": SUBJECT_VAR[s.slug] } as CSSProperties}
                aria-pressed={filter.subject === s.slug}
                onClick={() => {
                  setFilter({ subject: s.slug });
                  document.documentElement.style.setProperty("--accent-current", SUBJECT_VAR[s.slug]);
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="filters__row">
            <span className="filters__label t-label">Mode</span>
            {MODE_OPTS.map((o, i) => (
              <button key={o.v} type="button" className="tag" style={{ "--rot": tilt(i + 15, 1.2) } as CSSProperties} aria-pressed={filter.mode === o.v} onClick={() => setFilter({ mode: o.v })}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {visible.length} course{visible.length === 1 ? "" : "s"} shown
        </p>

        <motion.div layout={!reduce} className="courses__grid" data-growth-strands="" data-gdx="-28">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((c) => (
              <motion.div
                key={c.id}
                layout={!reduce}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={reduce ? { duration: 0 } : { duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
              >
                <CourseCard course={c} batches={batchesByCourse.get(c.id) ?? []} onDetails={() => setOpenId(c.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {visible.length === 0 && (
          <p className="courses__empty t-label">
            No course matches those filters yet.{" "}
            <button type="button" className="link-draw link-draw--on" onClick={() => setFilter({ cls: "all", subject: "all", mode: "all" })}>
              Clear filters
            </button>
          </p>
        )}
        {data.courses.length === 0 && <p className="courses__empty">The course list is being updated — ask on WhatsApp for current batches.</p>}
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && <CourseDrawer key={open.id} course={open} batches={batchesByCourse.get(open.id) ?? []} onClose={close} />}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}
