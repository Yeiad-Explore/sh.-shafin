"use client";

import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useToday } from "@/lib/hooks";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PlateHeader, Arrow } from "./bits";
import { useSite } from "./SiteProvider";
import { DAYS, DAY_LONG, SUBJECT_VAR, fmtDate, fmtMode, fmtTime, seatStatus, seatsLeft, STATUS_LABEL } from "@/lib/format";
import { getBrowserClient } from "@/lib/supabase";
import { EASE_OUT } from "@/lib/motion";
import SuccessCheck from "./SuccessCheck";
import type { Batch } from "@/lib/types";

function Tally({ n }: { n: number }) {
  const groups = Math.floor(n / 5);
  const rest = n % 5;
  const marks: React.ReactNode[] = [];
  for (let g = 0; g < groups; g++) {
    marks.push(
      <svg key={`g${g}`} viewBox="0 0 26 14" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${3 + i * 5} 1 L${3 + i * 5} 13`} />
        ))}
        <path d="M0 11 L 22 3" />
      </svg>,
    );
  }
  if (rest)
    marks.push(
      <svg key="r" viewBox={`0 0 ${rest * 5 + 2} 14`} aria-hidden="true" style={{ width: rest * 5 + 2 }}>
        {Array.from({ length: rest }, (_, i) => (
          <path key={i} d={`M${3 + i * 5} 1 L${3 + i * 5} 13`} />
        ))}
      </svg>,
    );
  return (
    <span className="tally" role="img" aria-label={`${n} seats left`}>
      {n === 0 ? <span className="t-label">0</span> : marks}
    </span>
  );
}

function Slot({ batch }: { batch: Batch }) {
  const { courseById, subjectById } = useSite();
  const course = courseById.get(batch.course_id);
  const subject = course?.subject_id ? subjectById.get(course.subject_id) : undefined;
  const st = seatStatus(batch);
  return (
    <div className="slot" style={{ "--c": subject ? SUBJECT_VAR[subject.slug] : "var(--accent)" } as CSSProperties}>
      <span className="slot__name">
        <i aria-hidden="true" />
        {batch.name}
      </span>
      <span className="slot__meta">
        {fmtTime(batch.start_time)}–{fmtTime(batch.end_time)} · {fmtMode(batch.mode)}
      </span>
      <Tally n={seatsLeft(batch)} />
      <span className={`badge badge--${st}`}>{STATUS_LABEL[st]}</span>
    </div>
  );
}

/** The week fills in day by day, left to right; today's column is lit. */
function Timetable({ batches, days }: { batches: Batch[]; days: string[] }) {
  const rows = useMemo(() => Array.from(new Set(batches.map((b) => b.start_time))).sort(), [batches]);
  const cols = days.length;
  const today = useToday().day;
  const reduce = useReducedMotion();
  return (
    <div className="tt" data-inview="" role="table" aria-label="Weekly timetable" style={{ "--tt-cols": cols } as CSSProperties}>
      <div className="tt__lines" aria-hidden="true">
        {Array.from({ length: cols }, (_, i) => (
          <span
            key={i}
            className="tt__v"
            style={{ left: `calc(96px + (100% - 96px) * ${i / cols})`, "--delay": `${500 + i * 70}ms` } as CSSProperties}
          />
        ))}
      </div>
      <div role="row" style={{ display: "contents" }}>
        <div className="tt__head t-label" role="columnheader">
          Time
        </div>
        {days.map((d) => (
          <div key={d} className={`tt__head t-label ${d === today ? "is-today" : ""}`} role="columnheader" aria-label={d === today ? `${DAY_LONG[d]}, today` : DAY_LONG[d]}>
            {d}
            {d === today && <span className="tt__today">Today</span>}
          </div>
        ))}
      </div>
      {rows.map((time, ri) => (
        <div role="row" key={time} style={{ display: "contents" }}>
          <div style={{ gridColumn: "1 / -1", position: "relative", height: 0 }} aria-hidden="true">
            <span className="tt__h" style={{ top: 0, "--delay": `${ri * 90}ms` } as CSSProperties} />
          </div>
          <div className="tt__time t-label" role="rowheader">
            {fmtTime(time)}
          </div>
          {days.map((d, di) => {
            const here = batches.filter((b) => b.start_time === time && b.days.includes(d));
            return (
              <div key={d} className={`tt__cell ${d === today ? "is-today" : ""}`} role="cell" aria-label={here.length ? undefined : `${DAY_LONG[d]} ${fmtTime(time)}: no class`}>
                {here.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                    transition={{ duration: 0.5, ease: EASE_OUT, delay: di * 0.08 + ri * 0.03 }}
                  >
                    <Slot batch={b} />
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DayPicker({ batches, days }: { batches: Batch[]; days: string[] }) {
  const today = useToday().day;
  const [picked, setDay] = useState<string | null>(null);
  const day = picked ?? (days.includes(today) ? today : days[0]);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const list = batches.filter((b) => b.days.includes(day)).sort((a, b) => a.start_time.localeCompare(b.start_time));
  return (
    <div className="daypick">
      <div className="daypick__tabs" role="tablist" aria-label="Day">
        {days.map((d) => (
          <button
            key={d}
            role="tab"
            type="button"
            aria-selected={d === day}
            className="daypick__tab"
            onClick={() => {
              setDir(days.indexOf(d) > days.indexOf(day) ? 1 : -1);
              setDay(d);
            }}
          >
            {d}
            {d === today && <span className="daypick__today" aria-label="today" />}
          </button>
        ))}
      </div>
      <div style={{ overflow: "hidden" }} role="tabpanel" aria-label={DAY_LONG[day]}>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={day}
            custom={dir}
            initial={{ x: reduce ? 0 : dir * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduce ? 0 : dir * -40, opacity: 0 }}
            transition={{ duration: reduce ? 0.1 : 0.4, ease: EASE_OUT }}
            style={{ display: "grid", gap: 10 }}
          >
            {list.length ? (
              list.map((b, i) => (
                <motion.div key={b.id} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT, delay: i * 0.06 }}>
                  <Slot batch={b} />
                </motion.div>
              ))
            ) : (
              <p className="muted t-label">No batches on {DAY_LONG[day]}.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TrialBooking() {
  const { data } = useSite();
  const slots = data.trialSlots;
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cls, setCls] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const slot = slots.find((s) => s.id === selected);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!slot) return;
    const digits = phone.replace(/\D/g, "");
    if (name.trim().length < 2) return setErr("Write the student's name.");
    if (digits.length < 10 || digits.length > 14) return setErr("Write a phone number we can call, like 01XXXXXXXXX.");
    setErr(null);
    setState("sending");
    const sb = getBrowserClient();
    const { error } = sb
      ? await sb.from("enrollments").insert({
          kind: "trial",
          student_name: name.trim(),
          class: cls || null,
          parent_phone: phone.trim(),
          mode: slot.mode,
          preferred_time: `${DAY_LONG[slot.day]} ${fmtTime(slot.start_time)} (${fmtMode(slot.mode)})`,
          message: "Free trial class request",
        })
      : { error: new Error("offline") };
    setState(error ? "error" : "done");
  };

  if (!slots.length) return null;

  return (
    <div>
      <h3 className="t-display t-h3" style={{ margin: "0 0 10px" }}>
        Book a free trial
      </h3>
      <p className="muted" style={{ margin: "0 0 24px", maxWidth: "42ch" }}>
        Pick a slot. The first class is free — come and see how a topic is taught before you decide.
      </p>
      <div className="chips" role="group" aria-label="Free trial slots">
        {slots.map((s) => (
          <button key={s.id} type="button" className="chip" aria-pressed={selected === s.id} onClick={() => setSelected(s.id)}>
            <svg className="chip__check" viewBox="0 0 14 14" aria-hidden="true">
              <path pathLength={1} d="M2 7.5 L5.5 11 L12 3" />
            </svg>
            {s.day.toUpperCase()} · {fmtTime(s.start_time)} · {s.mode === "online" ? "ONLINE" : "IN PERSON"}
          </button>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {slot && state !== "done" && (
          <motion.form
            onSubmit={submit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
            noValidate
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0 24px", paddingTop: 8 }}>
              <label className={`field ${name ? "has-value" : ""}`}>
                <span className="field__label">Student name</span>
                <input className="field__input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                <span className="field__rule" />
              </label>
              <label className={`field ${phone ? "has-value" : ""}`}>
                <span className="field__label">Parent&apos;s phone</span>
                <input className="field__input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" required />
                <span className="field__rule" />
              </label>
              <label className="field field--fixed">
                <span className="field__label">Class</span>
                <select className="field__input" value={cls} onChange={(e) => setCls(e.target.value)}>
                  <option value="">Choose…</option>
                  {["Class 9", "Class 10", "Class 11", "Class 12"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <span className="field__rule" />
              </label>
            </div>
            {err && (
              <p className="field__error" role="alert">
                <span>{err}</span>
              </p>
            )}
            <button type="submit" className="btn btn--ink" style={{ marginTop: 24 }} disabled={state === "sending"}>
              {state === "sending" ? "Booking…" : "Book this trial"} <Arrow />
            </button>
            {state === "error" && (
              <p className="field__error" role="alert">
                <span>Couldn&apos;t send just now. Please try again, or use the form below.</span>
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
      {state === "done" && slot && (
        <p role="status" className="trial-done t-label">
          <SuccessCheck size={36} />
          <span>
            Trial requested for {DAY_LONG[slot.day]} at {fmtTime(slot.start_time)}. Shafin will confirm by phone within 24 hours.
          </span>
        </p>
      )}
    </div>
  );
}

export default function Schedule() {
  const { data, courseById, enrollCourse } = useSite();
  const { batches, settings } = data;
  const today = useToday().iso;
  // Friday is the weekend, so its column only appears when a batch actually meets then.
  const days: string[] = batches.some((b) => b.days.includes("Fri")) ? [...DAYS, "Fri"] : [...DAYS];
  const upcoming = batches
    .filter((b) => b.start_date && b.start_date >= today)
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""))
    .slice(0, 5);

  return (
    <section id="schedule" className="plate slate" aria-labelledby="schedule-title">
      <div className="wrap">
        <PlateHeader label="Schedule" id="schedule-title" title="This week's board" />

        {settings.notice_active && settings.notice && (
          <div className="notice" role="note" data-reveal="fade">
            <span className="t-label">Notice</span>
            <span>{settings.notice}</span>
          </div>
        )}

        {batches.length > 0 ? (
          <>
            <Timetable batches={batches} days={days} />
            <DayPicker batches={batches} days={days} />
          </>
        ) : (
          <p className="muted">The new timetable is being set — book a free trial and Shafin will suggest a batch.</p>
        )}

        <div className="sched__cols">
          <div data-reveal="fade">
            <h3 className="t-display t-h3" style={{ margin: "0 0 18px" }}>
              Upcoming batches
            </h3>
            {upcoming.length === 0 && <p className="muted">No new start dates announced yet. Ongoing batches with open seats accept students any time.</p>}
            {upcoming.map((b) => {
              const course = courseById.get(b.course_id);
              const st = seatStatus(b);
              return (
                <div className="upcoming__row" key={b.id}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{course?.title ?? b.name}</div>
                    <div className="t-label muted">
                      Starts {fmtDate(b.start_date)} · {b.days.join(" · ")} · {fmtTime(b.start_time)} · {seatsLeft(b)} seats left
                    </div>
                  </div>
                  {st === "full" ? (
                    <span className="badge badge--full">Full</span>
                  ) : (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => enrollCourse(b.course_id)}>
                      {st === "waitlist" ? "Join waitlist" : "Enroll"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div data-reveal="fade" style={{ "--delay": "120ms" } as CSSProperties}>
            <TrialBooking />
          </div>
        </div>
      </div>
    </section>
  );
}
