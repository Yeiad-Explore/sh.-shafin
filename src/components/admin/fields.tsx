"use client";

import { useRef, useState } from "react";
import { useAdmin } from "./ctx";
import type { FieldDef } from "./config";

const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function TagsInput({ value, onChange, id }: { value: string[]; onChange: (v: string[]) => void; id: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) onChange([...value, ...parts]);
    setDraft("");
  };
  return (
    <div className="adm-tags">
      {value.map((t, i) => (
        <span key={`${t}-${i}`} className="adm-tag">
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        className="adm-input adm-tags__input"
        value={draft}
        placeholder="Type and press Enter"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
      />
    </div>
  );
}

function SyllabusEditor({ value, onChange }: { value: { chapter: string; topics: string[] }[]; onChange: (v: { chapter: string; topics: string[] }[]) => void }) {
  const update = (i: number, patch: Partial<{ chapter: string; topics: string[] }>) => onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, d: number) => {
    const next = [...value];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="adm-list">
      {value.map((c, i) => (
        <div key={i} className="adm-sub">
          <div className="adm-sub__row">
            <span className="adm-mono">{String(i + 1).padStart(2, "0")}</span>
            <input className="adm-input" value={c.chapter} placeholder="Chapter name" onChange={(e) => update(i, { chapter: e.target.value })} />
            <button type="button" className="adm-icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
              ↑
            </button>
            <button type="button" className="adm-icon" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
              ↓
            </button>
            <button type="button" className="adm-icon adm-icon--danger" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove chapter">
              ×
            </button>
          </div>
          <TagsInput id={`syl-${i}`} value={c.topics} onChange={(topics) => update(i, { topics })} />
        </div>
      ))}
      <button type="button" className="adm-btn adm-btn--ghost" onClick={() => onChange([...value, { chapter: "", topics: [] }])}>
        + Add chapter
      </button>
    </div>
  );
}

function QaEditor({ value, onChange }: { value: { q: string; a: string }[]; onChange: (v: { q: string; a: string }[]) => void }) {
  const update = (i: number, patch: Partial<{ q: string; a: string }>) => onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div className="adm-list">
      {value.map((c, i) => (
        <div key={i} className="adm-sub">
          <div className="adm-sub__row">
            <input className="adm-input" value={c.q} placeholder="Question" onChange={(e) => update(i, { q: e.target.value })} />
            <button type="button" className="adm-icon adm-icon--danger" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove question">
              ×
            </button>
          </div>
          <textarea className="adm-input" rows={2} value={c.a} placeholder="Answer" onChange={(e) => update(i, { a: e.target.value })} />
        </div>
      ))}
      <button type="button" className="adm-btn adm-btn--ghost" onClick={() => onChange([...value, { q: "", a: "" }])}>
        + Add question
      </button>
    </div>
  );
}

export function ImageInput({ value, onChange, id }: { value: string | null; onChange: (v: string | null) => void; id: string }) {
  const { sb, toast } = useAdmin();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast("Image must be under 5 MB", "err");
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from("media").upload(path, file, { cacheControl: "31536000", contentType: file.type });
    setBusy(false);
    if (error) return toast(error.message, "err");
    const { data } = sb.storage.from("media").getPublicUrl(path);
    onChange(data.publicUrl);
  };
  return (
    <div className="adm-image">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" />
      ) : (
        <div className="adm-image__empty adm-mono">No photo</div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          ref={fileRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button type="button" className="adm-btn adm-btn--ghost" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
        </button>
        {value && (
          <button type="button" className="adm-btn adm-btn--ghost" onClick={() => onChange(null)}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export function FieldInput({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const { courses, subjects } = useAdmin();
  const id = `f-${def.key}`;
  switch (def.type) {
    case "textarea":
      return <textarea id={id} className="adm-input" rows={4} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} required={def.required} />;
    case "number":
      return (
        <input
          id={id}
          type="number"
          className="adm-input"
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          required={def.required}
        />
      );
    case "bool":
      return (
        <label className="adm-switch">
          <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span className="adm-switch__track" aria-hidden="true" />
          <span>{value ? "Yes" : "No"}</span>
        </label>
      );
    case "select":
      return (
        <select id={id} className="adm-input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)} required={def.required}>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "course":
      return (
        <select id={id} className="adm-input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value || null)} required={def.required}>
          <option value="">Choose a course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      );
    case "subject":
      return (
        <select id={id} className="adm-input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">All subjects / mixed</option>
          {subjects.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      );
    case "tags":
      return <TagsInput id={id} value={(value as string[]) ?? []} onChange={onChange} />;
    case "date":
      return <input id={id} type="date" className="adm-input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value || null)} />;
    case "time":
      return <input id={id} type="time" className="adm-input" value={((value as string) ?? "").slice(0, 5)} onChange={(e) => onChange(e.target.value)} required={def.required} />;
    case "days": {
      const v = (value as string[]) ?? [];
      return (
        <div className="adm-days" role="group" aria-label={def.label}>
          {DAYS.map((d) => (
            <button key={d} type="button" className="adm-chip" aria-pressed={v.includes(d)} onClick={() => onChange(v.includes(d) ? v.filter((x) => x !== d) : DAYS.filter((x) => x === d || v.includes(x)))}>
              {d}
            </button>
          ))}
        </div>
      );
    }
    case "syllabus":
      return <SyllabusEditor value={(value as { chapter: string; topics: string[] }[]) ?? []} onChange={onChange} />;
    case "qa":
      return <QaEditor value={(value as { q: string; a: string }[]) ?? []} onChange={onChange} />;
    case "image":
      return <ImageInput id={id} value={(value as string) ?? null} onChange={onChange} />;
    case "colour":
      return <input id={id} type="color" className="adm-input" value={(value as string) ?? "#16150F"} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input id={id} className="adm-input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} required={def.required} />;
  }
}
