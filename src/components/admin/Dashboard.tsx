"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./ctx";

interface Stats {
  newEnrollments: number;
  totalEnrollments: number;
  courses: number;
  batches: number;
  seatsLeft: number;
  fullBatches: number;
  pendingTestimonials: number;
  results: number;
}

export default function Dashboard({ go }: { go: (k: string) => void }) {
  const { sb } = useAdmin();
  const [s, setS] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<{ id: string; student_name: string; kind: string; created_at: string; status: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [enr, courses, batches, testimonials, results, latest] = await Promise.all([
        sb.from("enrollments").select("status"),
        sb.from("courses").select("id", { count: "exact", head: true }).eq("published", true),
        sb.from("batches").select("seats_total,seats_taken").eq("published", true),
        sb.from("testimonials").select("published,consent"),
        sb.from("results").select("id", { count: "exact", head: true }),
        sb.from("enrollments").select("id,student_name,kind,created_at,status").order("created_at", { ascending: false }).limit(5),
      ]);
      const b = batches.data ?? [];
      setS({
        newEnrollments: (enr.data ?? []).filter((r) => r.status === "new").length,
        totalEnrollments: (enr.data ?? []).length,
        courses: courses.count ?? 0,
        batches: b.length,
        seatsLeft: b.reduce((a, x) => a + Math.max(0, x.seats_total - x.seats_taken), 0),
        fullBatches: b.filter((x) => x.seats_taken >= x.seats_total).length,
        pendingTestimonials: (testimonials.data ?? []).filter((t) => !t.consent).length,
        results: results.count ?? 0,
      });
      setRecent(latest.data ?? []);
    })();
  }, [sb]);

  const card = (n: number | string, label: string, to: string, accent?: boolean) => (
    <button type="button" className={`adm-stat ${accent ? "adm-stat--accent" : ""}`} onClick={() => go(to)}>
      <span className="adm-stat__n">{n}</span>
      <span className="adm-stat__l">{label}</span>
    </button>
  );

  return (
    <section>
      <header className="adm-head">
        <div>
          <h1>Dashboard</h1>
          <p className="adm-muted">Everything on the public page is edited here. Saves go live within seconds.</p>
        </div>
        <a className="adm-btn adm-btn--ghost" href="/" target="_blank" rel="noopener noreferrer">
          View site ↗
        </a>
      </header>
      {!s ? (
        <p className="adm-muted adm-mono">Loading…</p>
      ) : (
        <>
          <div className="adm-stats">
            {card(s.newEnrollments, "new requests", "enrollments", s.newEnrollments > 0)}
            {card(s.totalEnrollments, "requests in total", "enrollments")}
            {card(s.courses, "published courses", "courses")}
            {card(`${s.seatsLeft}`, `seats left across ${s.batches} batches`, "batches")}
            {card(s.fullBatches, "full batches", "batches")}
            {card(s.results, "result figures", "results")}
          </div>

          <div className="adm-two">
            <div className="adm-card">
              <h2 className="adm-h2">Latest requests</h2>
              {recent.length === 0 ? (
                <p className="adm-muted">No requests yet. They appear here the moment someone sends the slip.</p>
              ) : (
                <ul className="adm-mini">
                  {recent.map((r) => (
                    <li key={r.id}>
                      <span className="adm-strong">{r.student_name}</span>
                      <span className="adm-muted">{r.kind === "trial" ? "Free trial" : "Enrollment"}</span>
                      <span className={`adm-pill adm-pill--${r.status}`}>{r.status}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => go("enrollments")}>
                Open inbox →
              </button>
            </div>
            <div className="adm-card">
              <h2 className="adm-h2">Still to add</h2>
              <ul className="adm-todo">
                <li>Portrait photo — Site text</li>
                <li>WhatsApp number, phone, teaching place — Site text</li>
                <li>Teaching philosophy in your own words — Site text</li>
                <li>Monthly fees for each course — Courses</li>
                <li>Real result figures (no estimates) — Results</li>
                <li>Testimonials with parent consent — Testimonials{s.pendingTestimonials ? ` (${s.pendingTestimonials} waiting for consent)` : ""}</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
