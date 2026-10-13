"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAdmin } from "./ctx";
import { FieldInput } from "./fields";
import type { TableDef } from "./config";

type Row = Record<string, unknown> & { id: string; sort_order?: number; published?: boolean };

const fmtTime = (t: unknown) => {
  if (typeof t !== "string") return "";
  const [h, m] = t.split(":");
  const n = Number(h);
  return `${n % 12 || 12}:${m} ${n >= 12 ? "PM" : "AM"}`;
};

export function SidePanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <motion.div className="adm-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        className="adm-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
      >
        <div className="adm-panel__head">
          <h2>{title}</h2>
          <button type="button" className="adm-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </motion.aside>
    </>
  );
}

export default function TableManager({ def }: { def: TableDef }) {
  const { sb, toast, saved, courses, subjects, reloadLookups } = useAdmin();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const q = sb.from(def.table).select("*");
    const { data, error } = def.orderable ? await q.order("sort_order").order("id") : await q;
    setLoading(false);
    if (error) return toast(error.message, "err");
    setRows((data as Row[]) ?? []);
  }, [sb, def, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount; state is set after the request resolves
    load();
    setEditing(null);
  }, [load]);

  const afterWrite = async () => {
    await load();
    if (def.table === "courses" || def.table === "subjects") reloadLookups();
    await saved();
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    for (const f of def.fields) {
      const v = editing[f.key];
      if (f.required && (v === null || v === undefined || v === "")) return toast(`${f.label} is required`, "err");
    }
    if (def.table === "testimonials" && editing.published && !editing.consent) return toast("Tick parent consent before publishing", "err");
    if (def.table === "batches" && Number(editing.seats_taken) > Number(editing.seats_total) * 3) return toast("Seats taken looks too high", "err");
    setBusy(true);
    const payload: Record<string, unknown> = {};
    for (const f of def.fields) payload[f.key] = editing[f.key] ?? null;
    for (const f of def.fields) if ((f.type === "tags" || f.type === "days") && payload[f.key] === null) payload[f.key] = [];
    for (const f of def.fields) if ((f.type === "syllabus" || f.type === "qa") && payload[f.key] === null) payload[f.key] = [];
    if (def.publishable) payload.published = editing.published ?? true;
    let error;
    if (isNew) {
      if (def.orderable) payload.sort_order = rows.length ? Math.max(...rows.map((r) => r.sort_order ?? 0)) + 1 : 0;
      ({ error } = await sb.from(def.table).insert(payload));
    } else {
      ({ error } = await sb.from(def.table).update(payload).eq("id", editing.id));
    }
    setBusy(false);
    if (error) return toast(error.message, "err");
    setEditing(null);
    await afterWrite();
  };

  const togglePublished = async (row: Row) => {
    if (def.table === "testimonials" && !row.published && !row.consent) return toast("Tick parent consent before publishing", "err");
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, published: !r.published } : r)));
    const { error } = await sb.from(def.table).update({ published: !row.published }).eq("id", row.id);
    if (error) {
      toast(error.message, "err");
      return load();
    }
    await saved(row.published ? "Hidden from the site" : "Published — live on the site");
  };

  const remove = async (id: string) => {
    const { error } = await sb.from(def.table).delete().eq("id", id);
    setConfirmDel(null);
    if (error) return toast(error.message, "err");
    await afterWrite();
  };

  const persistOrder = async (next: Row[]) => {
    setRows(next);
    const changed = next.map((r, i) => ({ r, i })).filter(({ r, i }) => r.sort_order !== i);
    if (!changed.length) return; // a drag that ended where it started
    const results = await Promise.all(changed.map(({ r, i }) => sb.from(def.table).update({ sort_order: i }).eq("id", r.id)));
    const err = results.find((x) => x.error)?.error;
    if (err) {
      toast(err.message, "err");
      return load();
    }
    setRows(next.map((r, i) => ({ ...r, sort_order: i })));
    await saved("Order saved — live on the site");
  };

  const move = (id: string, d: number) => {
    const i = rows.findIndex((r) => r.id === id);
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    const [x] = next.splice(i, 1);
    next.splice(j, 0, x);
    persistOrder(next);
  };

  const cell = (row: Row, col: TableDef["columns"][number]) => {
    const v = row[col.key];
    switch (col.render) {
      case "bool":
        return v ? "✓" : "—";
      case "subject": {
        if (!v) return "—";
        const s = subjects.find((x) => x.id === v || x.slug === v);
        return s ? (
          <span className="adm-subj">
            <i className={`adm-dot adm-dot--${s.slug}`} />
            {s.label}
          </span>
        ) : (
          String(v)
        );
      }
      case "course":
        return courses.find((c) => c.id === v)?.label ?? "—";
      case "days":
        return Array.isArray(v) ? v.join(" · ") : "";
      case "time":
        return fmtTime(v);
      case "seats": {
        const total = Number(row.seats_total);
        const taken = Number(row.seats_taken);
        const left = total - taken;
        const label = left <= 0 ? (row.waitlist ? "Waitlist" : "Full") : taken / total >= 0.75 ? "Few seats" : "Open";
        return (
          <span>
            {taken}/{total} <span className={`adm-pill adm-pill--${label.toLowerCase().replace(" ", "-")}`}>{label}</span>
          </span>
        );
      }
      default:
        return v === null || v === undefined || v === "" ? "—" : String(v);
    }
  };

  return (
    <section>
      <header className="adm-head">
        <div>
          <h1>{def.title}</h1>
          <p className="adm-muted">{def.description}</p>
        </div>
        {def.canAdd !== false && (
          <button
            type="button"
            className="adm-btn"
            onClick={() => {
              setIsNew(true);
              setEditing({ id: "", ...def.defaults } as Row);
            }}
          >
            + Add {def.singular}
          </button>
        )}
      </header>

      {loading ? (
        <p className="adm-muted adm-mono">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="adm-empty">
          <p>Nothing here yet.</p>
          {def.canAdd !== false && (
            <button
              type="button"
              className="adm-btn"
              onClick={() => {
                setIsNew(true);
                setEditing({ id: "", ...def.defaults } as Row);
              }}
            >
              Add the first {def.singular}
            </button>
          )}
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                {def.orderable && <th aria-label="Order" style={{ width: 70 }} />}
                {def.columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                {def.publishable && <th style={{ width: 110 }}>Published</th>}
                <th style={{ width: 170 }} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={dragId === row.id ? "is-dragging" : ""}
                  draggable={def.orderable}
                  onDragStart={(e) => {
                    setDragId(row.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    if (!dragId || dragId === row.id) return;
                    e.preventDefault();
                    const from = rows.findIndex((r) => r.id === dragId);
                    const next = [...rows];
                    const [x] = next.splice(from, 1);
                    next.splice(i, 0, x);
                    setRows(next);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    persistOrder(rows);
                  }}
                >
                  {def.orderable && (
                    <td className="adm-order">
                      <span className="adm-grip" aria-hidden="true" title="Drag to reorder">
                        ⋮⋮
                      </span>
                      <span className="adm-order__btns">
                        <button type="button" className="adm-icon adm-icon--sm" onClick={() => move(row.id, -1)} disabled={i === 0} aria-label="Move up">
                          ↑
                        </button>
                        <button type="button" className="adm-icon adm-icon--sm" onClick={() => move(row.id, 1)} disabled={i === rows.length - 1} aria-label="Move down">
                          ↓
                        </button>
                      </span>
                    </td>
                  )}
                  {def.columns.map((c) => (
                    <td key={c.key} className={c.key === def.columns[0].key ? "adm-strong" : ""}>
                      {cell(row, c)}
                    </td>
                  ))}
                  {def.publishable && (
                    <td>
                      <label className="adm-switch">
                        <input type="checkbox" checked={!!row.published} onChange={() => togglePublished(row)} aria-label={`Published: ${String(row[def.columns[0].key])}`} />
                        <span className="adm-switch__track" aria-hidden="true" />
                      </label>
                    </td>
                  )}
                  <td className="adm-actions">
                    {confirmDel === row.id ? (
                      <>
                        <span className="adm-mono">Delete?</span>
                        <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => remove(row.id)}>
                          Yes
                        </button>
                        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setConfirmDel(null)}>
                          No
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="adm-btn adm-btn--ghost adm-btn--sm"
                          onClick={() => {
                            setIsNew(false);
                            setEditing({ ...row });
                          }}
                        >
                          Edit
                        </button>
                        {def.canDelete !== false && (
                          <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setConfirmDel(row.id)}>
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <SidePanel title={isNew ? `New ${def.singular}` : `Edit ${def.singular}`} onClose={() => setEditing(null)}>
            <form className="adm-form" onSubmit={save}>
              <div className="adm-form__grid">
                {def.fields.map((f) => (
                  <div key={f.key} className={`adm-field ${f.full || ["textarea", "tags", "syllabus", "qa", "image", "days"].includes(f.type) ? "adm-field--full" : ""}`}>
                    <label htmlFor={`f-${f.key}`} className="adm-label">
                      {f.label}
                      {f.required && <span aria-hidden="true"> *</span>}
                    </label>
                    <FieldInput def={f} value={editing[f.key]} onChange={(v) => setEditing((e) => (e ? { ...e, [f.key]: v } : e))} />
                    {f.help && <span className="adm-help">{f.help}</span>}
                  </div>
                ))}
                {def.publishable && (
                  <div className="adm-field adm-field--full">
                    <span className="adm-label">Visibility</span>
                    <label className="adm-switch">
                      <input type="checkbox" checked={!!editing.published} onChange={(e) => setEditing((x) => (x ? { ...x, published: e.target.checked } : x))} />
                      <span className="adm-switch__track" aria-hidden="true" />
                      <span>{editing.published ? "Published on the site" : "Hidden (draft)"}</span>
                    </label>
                  </div>
                )}
              </div>
              <div className="adm-form__foot">
                <button type="submit" className="adm-btn" disabled={busy}>
                  {busy ? "Saving…" : "Save"}
                </button>
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </SidePanel>
        )}
      </AnimatePresence>
    </section>
  );
}
