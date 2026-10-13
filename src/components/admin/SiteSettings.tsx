"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAdmin } from "./ctx";
import { ImageInput } from "./fields";
import type { SectionKey, SiteSettings as Settings } from "@/lib/types";

const SECTION_LABEL: Record<SectionKey, string> = {
  about: "About",
  subjects: "Subjects",
  courses: "Courses",
  schedule: "Schedule",
  results: "Results",
  faq: "FAQ",
  contact: "Contact",
};

const TEXT_FIELDS: { key: keyof Settings; label: string; type?: "textarea"; help?: string }[] = [
  { key: "hero_headline", label: "Hero headline" },
  { key: "hero_subline", label: "Hero sub-line" },
  { key: "bio", label: "Bio (About)", type: "textarea" },
  { key: "philosophy", label: "Teaching philosophy (in your own words)", type: "textarea", help: "Shown under the bio when filled in." },
  { key: "phone", label: "Phone (public)", help: "Leave empty to hide." },
  { key: "whatsapp", label: "WhatsApp number", help: "With country code, e.g. 8801XXXXXXXXX. Powers the floating button." },
  { key: "email", label: "Email" },
  { key: "teaching_place", label: "Where classes happen", help: "e.g. coaching centre name or 'Home batches, Mohammadpur'" },
  { key: "address", label: "Address for the map", help: "Leave empty if you only teach online — the map hides." },
  { key: "facebook", label: "Facebook page URL" },
  { key: "youtube", label: "YouTube URL" },
  { key: "instagram", label: "Instagram URL" },
];

export default function SiteSettings() {
  const { sb, toast, saved } = useAdmin();
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [payDraft, setPayDraft] = useState("");

  useEffect(() => {
    sb.from("site_settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (error) toast(error.message, "err");
        else setS(data as Settings);
      });
  }, [sb, toast]);

  if (!s) return <p className="adm-muted adm-mono">Loading…</p>;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => (p ? { ...p, [k]: v } : p));

  // Also runs on blur, so a method typed without pressing Enter isn't lost on Save.
  const addPayment = () => {
    if (payDraft.trim()) set("payment_methods", [...s.payment_methods, payDraft.trim()]);
    setPayDraft("");
  };

  const moveSection = (i: number, d: number) => {
    const next = [...s.section_order];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    set("section_order", next);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { id: _id, ...rest } = s;
    void _id;
    const payload = { ...rest } as Record<string, unknown>;
    delete payload.updated_at;
    for (const k of ["phone", "whatsapp", "email", "address", "teaching_place", "facebook", "youtube", "instagram", "notice", "photo_url"]) {
      if (payload[k] === "") payload[k] = null;
    }
    const { error } = await sb.from("site_settings").update(payload).eq("id", 1);
    setBusy(false);
    if (error) return toast(error.message, "err");
    await saved();
  };

  return (
    <section>
      <header className="adm-head">
        <div>
          <h1>Site text</h1>
          <p className="adm-muted">Page-wide words, contact details, the notice strip, and which sections show.</p>
        </div>
      </header>
      <form className="adm-form adm-card" onSubmit={submit}>
        <div className="adm-form__grid">
          <div className="adm-field adm-field--full">
            <span className="adm-label">Portrait (hero photo)</span>
            <ImageInput id="photo" value={s.photo_url} onChange={(v) => set("photo_url", v)} />
            <span className="adm-help">Until a photo is uploaded, the hero shows an ink drawing of a pressed plant specimen.</span>
          </div>
          {TEXT_FIELDS.map((f) => (
            <div key={f.key} className={`adm-field ${f.type === "textarea" ? "adm-field--full" : ""}`}>
              <label className="adm-label" htmlFor={`s-${f.key}`}>
                {f.label}
              </label>
              {f.type === "textarea" ? (
                <textarea id={`s-${f.key}`} className="adm-input" rows={5} value={(s[f.key] as string) ?? ""} onChange={(e) => set(f.key, e.target.value as never)} />
              ) : (
                <input id={`s-${f.key}`} className="adm-input" value={(s[f.key] as string) ?? ""} onChange={(e) => set(f.key, e.target.value as never)} />
              )}
              {f.help && <span className="adm-help">{f.help}</span>}
            </div>
          ))}

          <div className="adm-field adm-field--full">
            <span className="adm-label">Payment methods</span>
            <div className="adm-tags">
              {s.payment_methods.map((p, i) => (
                <span key={`${p}-${i}`} className="adm-tag">
                  {p}
                  <button type="button" aria-label={`Remove ${p}`} onClick={() => set("payment_methods", s.payment_methods.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </span>
              ))}
              <input
                className="adm-input adm-tags__input"
                placeholder="e.g. bKash — press Enter"
                value={payDraft}
                onChange={(e) => setPayDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPayment();
                  }
                }}
                onBlur={addPayment}
              />
            </div>
          </div>

          <div className="adm-field adm-field--full">
            <label className="adm-label" htmlFor="s-notice">
              Notice strip (Schedule section)
            </label>
            <input id="s-notice" className="adm-input" value={s.notice ?? ""} onChange={(e) => set("notice", e.target.value)} placeholder="e.g. No classes 14–16 Dec for the exam break" />
            <label className="adm-switch" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={s.notice_active} onChange={(e) => set("notice_active", e.target.checked)} />
              <span className="adm-switch__track" aria-hidden="true" />
              <span>{s.notice_active ? "Showing on the site" : "Hidden"}</span>
            </label>
          </div>

          <div className="adm-field adm-field--full">
            <span className="adm-label">Shafin AI (chat assistant)</span>
            <label className="adm-switch">
              <input type="checkbox" checked={s.chat_enabled !== false} onChange={(e) => set("chat_enabled", e.target.checked)} />
              <span className="adm-switch__track" aria-hidden="true" />
              <span>{s.chat_enabled !== false ? "On — visitors can ask questions (10 per day each)" : "Off — the chat button is hidden"}</span>
            </label>
            <span className="adm-help">It answers from the courses, batches, fees and FAQ you publish here.</span>
          </div>

          <div className="adm-field adm-field--full">
            <span className="adm-label">Sections — order and visibility</span>
            <ul className="adm-sections">
              {s.section_order.map((k, i) => (
                <li key={k}>
                  <span className="adm-mono">{String(i + 2).padStart(2, "0")}</span>
                  <span className="adm-strong" style={{ flex: 1 }}>
                    {SECTION_LABEL[k]}
                  </span>
                  <button type="button" className="adm-icon adm-icon--sm" disabled={i === 0} onClick={() => moveSection(i, -1)} aria-label={`Move ${SECTION_LABEL[k]} up`}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="adm-icon adm-icon--sm"
                    disabled={i === s.section_order.length - 1}
                    onClick={() => moveSection(i, 1)}
                    aria-label={`Move ${SECTION_LABEL[k]} down`}
                  >
                    ↓
                  </button>
                  <label className="adm-switch">
                    <input type="checkbox" checked={s.sections[k] !== false} onChange={(e) => set("sections", { ...s.sections, [k]: e.target.checked })} aria-label={`Show ${SECTION_LABEL[k]}`} />
                    <span className="adm-switch__track" aria-hidden="true" />
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="adm-form__foot adm-form__foot--sticky">
          <button type="submit" className="adm-btn" disabled={busy}>
            {busy ? "Saving…" : "Save site text"}
          </button>
        </div>
      </form>
    </section>
  );
}
