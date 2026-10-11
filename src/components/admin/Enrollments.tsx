"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "./ctx";
import type { Enrollment } from "@/lib/types";

const STATUSES: Enrollment["status"][] = ["new", "contacted", "enrolled", "closed"];
const LABEL: Record<Enrollment["status"], string> = { new: "New", contacted: "Contacted", enrolled: "Enrolled", closed: "Closed" };

function waHref(phone: string, name: string) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("01") && d.length === 11) d = `88${d}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(`Assalamu alaikum, this is Shafin about ${name}'s enrollment request.`)}`;
}

export default function Enrollments({ onCount }: { onCount?: (n: number) => void }) {
  const { sb, toast, courses } = useAdmin();
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState<"all" | Enrollment["status"]>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sb.from("enrollments").select("*").order("created_at", { ascending: false }).limit(500);
    setLoading(false);
    if (error) return toast(error.message, "err");
    setRows((data as Enrollment[]) ?? []);
    onCount?.((data ?? []).filter((r) => r.status === "new").length);
  }, [sb, toast, onCount]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount; state is set after the request resolves
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const setStatus = async (id: string, status: Enrollment["status"]) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await sb.from("enrollments").update({ status }).eq("id", id);
    if (error) {
      toast(error.message, "err");
      load();
    } else {
      toast(`Marked ${LABEL[status].toLowerCase()}`);
      onCount?.(rows.filter((r) => (r.id === id ? status : r.status) === "new").length);
    }
  };

  const remove = async (id: string) => {
    const { error } = await sb.from("enrollments").delete().eq("id", id);
    setConfirmDel(null);
    if (error) return toast(error.message, "err");
    toast("Deleted");
    load();
  };

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <section>
      <header className="adm-head">
        <div>
          <h1>Enrollments</h1>
          <p className="adm-muted">Requests from the enrollment slip and free-trial picker, newest first.</p>
        </div>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={load}>
          Refresh
        </button>
      </header>

      <div className="adm-filters" role="group" aria-label="Filter by status">
        {(["all", ...STATUSES] as const).map((s) => (
          <button key={s} type="button" className="adm-chip" aria-pressed={filter === s} onClick={() => setFilter(s)}>
            {s === "all" ? "All" : LABEL[s]} <span className="adm-mono">{s === "all" ? rows.length : rows.filter((r) => r.status === s).length}</span>
          </button>
        ))}
      </div>

      {loading && !rows.length ? (
        <p className="adm-muted adm-mono">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="adm-empty">
          <p>No requests here yet.</p>
        </div>
      ) : (
        <ul className="adm-inbox">
          {visible.map((r) => {
            const course = courses.find((c) => c.id === r.course_id)?.label;
            const isOpen = open === r.id;
            return (
              <li key={r.id} className={`adm-inbox__row ${r.status === "new" ? "is-new" : ""}`}>
                <div className="adm-inbox__main">
                  <button type="button" className="adm-inbox__toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.id)}>
                    <span className="adm-strong">{r.student_name}</span>
                    <span className="adm-muted">
                      {r.kind === "trial" ? "Free trial" : "Enrollment"} · {r.class ?? "class ?"}
                      {course ? ` · ${course}` : r.subjects.length ? ` · ${r.subjects.join(", ")}` : ""}
                    </span>
                    <span className="adm-mono adm-muted">
                      {new Date(r.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </button>
                  <div className="adm-inbox__actions">
                    <a className="adm-btn adm-btn--sm adm-btn--wa" href={waHref(r.parent_phone, r.student_name)} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                    <a className="adm-btn adm-btn--sm adm-btn--ghost" href={`tel:${r.parent_phone.replace(/[^\d+]/g, "")}`}>
                      Call
                    </a>
                    <div className="adm-pills" role="group" aria-label="Status">
                      {STATUSES.map((s) => (
                        <button key={s} type="button" className={`adm-pill adm-pill--${s}`} aria-pressed={r.status === s} onClick={() => setStatus(r.id, s)}>
                          {LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <dl className="adm-inbox__detail">
                    <dt>Parent&apos;s phone</dt>
                    <dd>{r.parent_phone}</dd>
                    {r.institution && (
                      <>
                        <dt>School / college</dt>
                        <dd>{r.institution}</dd>
                      </>
                    )}
                    {r.subjects.length > 0 && (
                      <>
                        <dt>Subjects</dt>
                        <dd>{r.subjects.join(", ")}</dd>
                      </>
                    )}
                    {course && (
                      <>
                        <dt>Course</dt>
                        <dd>{course}</dd>
                      </>
                    )}
                    {r.mode && (
                      <>
                        <dt>Mode</dt>
                        <dd>{r.mode}</dd>
                      </>
                    )}
                    {r.preferred_time && (
                      <>
                        <dt>Preferred time</dt>
                        <dd>{r.preferred_time}</dd>
                      </>
                    )}
                    {r.message && (
                      <>
                        <dt>Message</dt>
                        <dd style={{ whiteSpace: "pre-wrap" }}>{r.message}</dd>
                      </>
                    )}
                    <dt />
                    <dd>
                      {confirmDel === r.id ? (
                        <>
                          <span className="adm-mono">Delete this request? </span>
                          <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => remove(r.id)}>
                            Yes, delete
                          </button>{" "}
                          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setConfirmDel(null)}>
                            No
                          </button>
                        </>
                      ) : (
                        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setConfirmDel(r.id)}>
                          Delete
                        </button>
                      )}
                    </dd>
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
