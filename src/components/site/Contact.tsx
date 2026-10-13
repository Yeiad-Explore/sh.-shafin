"use client";

import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PlateHeader, Arrow } from "./bits";
import { useSite } from "./SiteProvider";
import { SUBJECT_VAR, fmtClass, telLink, waLink } from "@/lib/format";
import { getBrowserClient } from "@/lib/supabase";
import { EASE_OUT, triggerBloom } from "@/lib/motion";
import SuccessCheck from "./SuccessCheck";
import type { SubjectSlug } from "@/lib/types";

interface FormState {
  student_name: string;
  class: string;
  institution: string;
  subjects: SubjectSlug[];
  mode: "" | "online" | "offline";
  preferred_time: string;
  parent_phone: string;
  message: string;
  course_id: string;
}

const EMPTY: FormState = {
  student_name: "",
  class: "",
  institution: "",
  subjects: [],
  mode: "",
  preferred_time: "",
  parent_phone: "",
  message: "",
  course_id: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (f.student_name.trim().length < 2) e.student_name = "Write the student's full name.";
  if (!f.class) e.class = "Choose the student's class.";
  const digits = f.parent_phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 14) e.parent_phone = "Write a phone number we can call, like 01XXXXXXXXX.";
  if (!f.subjects.length && !f.course_id) e.subjects = "Pick at least one subject or a course.";
  if (f.message.length > 2000) e.message = "Keep the message under 2000 characters.";
  return e;
}

function Field({
  label,
  error,
  hasValue,
  fixed,
  full,
  children,
}: {
  label: string;
  error?: string;
  hasValue: boolean;
  fixed?: boolean;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`field ${hasValue ? "has-value" : ""} ${fixed ? "field--fixed" : ""} ${error ? "is-error" : ""} ${full ? "slip__full" : ""}`}>
      <span className="field__label">{label}</span>
      {children}
      <span className="field__rule" />
      {error && (
        <span className="field__error" role="alert">
          <span>{error}</span>
        </span>
      )}
    </label>
  );
}

export default function Contact() {
  const { data, enrollRequest, subjectById } = useSite();
  const { settings, courses, subjects } = data;
  const [f, setF] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const reduce = useReducedMotion();

  // "Enroll" anywhere on the page arrives here with the course pre-selected.
  const [appliedRequest, setAppliedRequest] = useState<typeof enrollRequest>(null);
  if (enrollRequest && enrollRequest !== appliedRequest) {
    setAppliedRequest(enrollRequest);
    const c = courses.find((x) => x.id === enrollRequest.courseId);
    if (c) {
      const slug = c.subject_id ? subjectById.get(c.subject_id)?.slug : undefined;
      setF((prev) => ({
        ...prev,
        course_id: c.id,
        subjects: slug && !prev.subjects.includes(slug) ? [...prev.subjects, slug] : prev.subjects,
        class: prev.class || (c.class_level === "9-10" || c.class_level === "10" ? "Class 10" : "Class 12"),
      }));
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setTimeout(() => document.querySelector<HTMLElement>(".slip .is-error input, .slip .is-error select, .slip .is-error textarea")?.focus({ preventScroll: true }), 0);
      return;
    }
    setStatus("sending");
    const sb = getBrowserClient();
    const payload = {
      kind: "enroll",
      student_name: f.student_name.trim(),
      class: f.class,
      institution: f.institution.trim() || null,
      subjects: f.subjects.map((s) => subjects.find((x) => x.slug === s)?.name ?? s),
      mode: f.mode || null,
      preferred_time: f.preferred_time.trim() || null,
      parent_phone: f.parent_phone.trim(),
      message: f.message.trim() || null,
      course_id: f.course_id || null,
    };
    const { error } = sb ? await sb.from("enrollments").insert(payload) : { error: new Error("not configured") };
    if (error) {
      console.error(error);
      setStatus("error");
      return;
    }
    setStatus("sent");
    triggerBloom();
  };

  const wa = waLink(settings.whatsapp, "Hi, I'd like to know about your science classes.");
  const tel = telLink(settings.phone);
  const showMap = Boolean(settings.address);

  return (
    <section id="contact" className="plate" aria-labelledby="contact-title">
      <div className="wrap">
        <PlateHeader label="Contact" id="contact-title" title="Start with one free class" />
        <div className="contact__grid">
          <div style={{ position: "relative" }}>
            <form className={`slip ${status === "sent" ? "is-sent" : ""}`} onSubmit={submit} noValidate aria-describedby="slip-note" data-reveal="fade">
              <div className="slip__head t-label">
                <span>Enrollment slip</span>
                <span>Lab entry no. —</span>
              </div>
              <fieldset disabled={status === "sending" || status === "sent"} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                <div className="slip__grid">
                  <Field label="Student name" error={errors.student_name} hasValue={!!f.student_name}>
                    <input className="field__input" value={f.student_name} onChange={(e) => set("student_name", e.target.value)} autoComplete="name" aria-invalid={!!errors.student_name} />
                  </Field>
                  <Field label="Class" error={errors.class} hasValue fixed>
                    <select className="field__input" value={f.class} onChange={(e) => set("class", e.target.value)} aria-invalid={!!errors.class}>
                      <option value="">Choose…</option>
                      {["Class 9", "Class 10", "Class 11", "Class 12", "HSC candidate (after Class 12)"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="School / college" hasValue={!!f.institution}>
                    <input className="field__input" value={f.institution} onChange={(e) => set("institution", e.target.value)} autoComplete="organization" />
                  </Field>
                  <Field label="Parent's phone" error={errors.parent_phone} hasValue={!!f.parent_phone}>
                    <input className="field__input" value={f.parent_phone} onChange={(e) => set("parent_phone", e.target.value)} inputMode="tel" autoComplete="tel" aria-invalid={!!errors.parent_phone} />
                  </Field>

                  <div className="slip__group slip__full">
                    <span className="t-label">Subjects</span>
                    <div className="slip__subjects" role="group" aria-label="Subjects">
                      {subjects.map((s) => {
                        const on = f.subjects.includes(s.slug);
                        return (
                          <button
                            type="button"
                            key={s.id}
                            className="tag"
                            data-subject={s.slug}
                            aria-pressed={on}
                            style={{ "--tag-c": SUBJECT_VAR[s.slug] } as CSSProperties}
                            onClick={() => set("subjects", on ? f.subjects.filter((x) => x !== s.slug) : [...f.subjects, s.slug])}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                    {errors.subjects && (
                      <span className="field__error" role="alert">
                        <span>{errors.subjects}</span>
                      </span>
                    )}
                  </div>

                  {courses.length > 0 && (
                    <Field label="Course (optional)" hasValue fixed full>
                      <select className="field__input" value={f.course_id} onChange={(e) => set("course_id", e.target.value)}>
                        <option value="">Not sure yet</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} — {fmtClass(c.class_level)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  <div className="slip__group">
                    <span className="t-label">Online or offline</span>
                    <div className="slip__subjects" role="radiogroup" aria-label="Class mode">
                      {(["online", "offline"] as const).map((m) => (
                        <button type="button" key={m} role="radio" aria-checked={f.mode === m} className={`tag ${f.mode === m ? "is-active" : ""}`} onClick={() => set("mode", f.mode === m ? "" : m)}>
                          {m === "online" ? "Online" : "Offline"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Preferred time" hasValue={!!f.preferred_time}>
                    <input className="field__input" value={f.preferred_time} onChange={(e) => set("preferred_time", e.target.value)} placeholder="" />
                  </Field>

                  <Field label="Message" error={errors.message} hasValue={!!f.message} full>
                    <textarea className="field__input" value={f.message} onChange={(e) => set("message", e.target.value)} rows={3} />
                  </Field>
                </div>

                <div className="slip__submit">
                  <button type="submit" className="btn btn--ink">
                    {status === "sending" ? "Sending…" : "Send enrollment request"} <Arrow />
                  </button>
                  <span id="slip-note" className="t-label" style={{ color: "var(--page-fg-2)" }}>
                    Shafin replies within 24 hours.
                  </span>
                </div>
                {status === "error" && (
                  <p className="field__error" role="alert" style={{ marginTop: 14 }}>
                    <span>The slip didn&apos;t go through. Check your connection and try again{wa ? ", or message on WhatsApp" : ""}.</span>
                  </p>
                )}
              </fieldset>
              <p role="status" className="sr-only">
                {status === "sent" ? "Received — Shafin will reply within 24 hours." : ""}
              </p>
            </form>

            <AnimatePresence>
              {status === "sent" && (
                <motion.div
                  className="slip__done"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0.2 : 0.5, ease: EASE_OUT, delay: reduce ? 0 : 0.15 }}
                >
                  <SuccessCheck size={72} />
                  <p className="slip__done-title">Request received</p>
                  <p className="slip__done-note">Shafin replies within 24 hours.</p>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setF(EMPTY);
                      setStatus("idle");
                    }}
                  >
                    Send another
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="contact__direct" aria-label="Direct contact" data-reveal="fade" style={{ "--delay": "120ms" } as CSSProperties}>
            {wa && (
              <div className="contact__big">
                <span className="t-label muted">WhatsApp</span>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="link-draw">
                  {settings.whatsapp}
                </a>
              </div>
            )}
            {tel && (
              <div className="contact__big">
                <span className="t-label muted">Phone</span>
                <a href={tel} className="link-draw">
                  {settings.phone}
                </a>
              </div>
            )}
            {settings.email && (
              <div className="contact__big">
                <span className="t-label muted">Email</span>
                <a href={`mailto:${settings.email}`} className="link-draw">
                  {settings.email}
                </a>
              </div>
            )}
            {settings.facebook && (
              <div className="contact__big">
                <span className="t-label muted">Facebook</span>
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="link-draw">
                  Facebook page ↗
                </a>
              </div>
            )}
            {(settings.teaching_place || settings.address) && (
              <div className="contact__big">
                <span className="t-label muted">Where classes happen</span>
                <span className="v">{settings.teaching_place || settings.address}</span>
                {settings.teaching_place && settings.address && <span className="muted">{settings.address}</span>}
              </div>
            )}
            {settings.payment_methods.length > 0 && (
              <div className="contact__big">
                <span className="t-label muted">Payment</span>
                <span>{settings.payment_methods.join(" · ")}</span>
              </div>
            )}
            {!wa && !tel && !settings.email && (
              <div className="contact__big">
                <span className="t-label muted">Fastest way</span>
                <span className="v">Send the slip — it reaches Shafin directly.</span>
              </div>
            )}
            {showMap && (
              <div className="map">
                <iframe
                  title="Teaching location map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(settings.address!)}&output=embed`}
                />
              </div>
            )}
          </aside>
        </div>
        {/* keeps the growth line in the margin past the form, until it turns into the footer flower */}
        <span data-growth="point" style={{ display: "block", height: 1, marginTop: 40 }} aria-hidden="true" />
      </div>
    </section>
  );
}
