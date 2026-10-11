"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAdmin } from "./ctx";

interface Login {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

/** calls the admin-logins Edge Function; returns its JSON or throws with its error message */
async function callLogins<T>(sb: SupabaseClient, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb.functions.invoke("admin-logins", { body });
  if (error) {
    const msg = await (error as { context?: Response }).context?.json?.().then((j: { error?: string }) => j.error).catch(() => null);
    throw new Error(msg || error.message);
  }
  return data as T;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "never";

function Logins() {
  const { sb, session, toast } = useAdmin();
  const [logins, setLogins] = useState<Login[] | null>(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLogins((await callLogins<{ logins: Login[] }>(sb, { action: "list" })).logins);
    } catch (e) {
      toast((e as Error).message, "err");
    }
  }, [sb, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount; state is set after the request resolves
    load();
  }, [load]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) return toast("Use at least 10 characters for the password", "err");
    setBusy(true);
    try {
      await callLogins(sb, { action: "add", email, password: pw });
      toast(`${email.trim()} can now sign in`);
      setEmail("");
      setPw("");
      await load();
    } catch (err) {
      toast((err as Error).message, "err");
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    setConfirmDel(null);
    try {
      await callLogins(sb, { action: "remove", user_id: id });
      toast("Login removed");
      await load();
    } catch (err) {
      toast((err as Error).message, "err");
    }
  };

  return (
    <div className="adm-card" style={{ maxWidth: 520, marginTop: 24 }}>
      <h2 className="adm-h2">Login emails</h2>
      <p className="adm-muted">Every email here can sign in to this admin panel with its own password.</p>
      {!logins ? (
        <p className="adm-muted adm-mono">Loading…</p>
      ) : (
        <ul className="adm-mini">
          {logins.map((l) => (
            <li key={l.user_id}>
              <span className="adm-strong">{l.email}</span>
              <span className="adm-muted adm-mono">last in: {when(l.last_sign_in_at)}</span>
              {l.user_id === session.user.id ? (
                <span className="adm-pill">you</span>
              ) : confirmDel === l.user_id ? (
                <>
                  <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => remove(l.user_id)}>
                    Yes, remove
                  </button>
                  <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setConfirmDel(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setConfirmDel(l.user_id)}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form className="adm-form" onSubmit={add}>
        <div className="adm-field">
          <label className="adm-label" htmlFor="nl-email">
            Add an email
          </label>
          <input id="nl-email" type="email" required className="adm-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="nl-pw">
            Password for it
          </label>
          <input id="nl-pw" type="password" required className="adm-input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          <span className="adm-help">At least 10 characters. It works right away — no confirmation email.</span>
        </div>
        <div className="adm-form__foot">
          <button className="adm-btn" type="submit" disabled={busy}>
            {busy ? "Adding…" : "Add login"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Account() {
  const { sb, session, toast } = useAdmin();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 10) return toast("Use at least 10 characters", "err");
    if (pw !== pw2) return toast("The two passwords don't match", "err");
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast(error.message, "err");
    setPw("");
    setPw2("");
    toast("Password changed");
  };

  return (
    <section>
      <header className="adm-head">
        <div>
          <h1>Account</h1>
          <p className="adm-muted">Signed in as {session.user.email}</p>
        </div>
      </header>
      <form className="adm-form adm-card" onSubmit={submit} style={{ maxWidth: 520 }}>
        <h2 className="adm-h2">Change password</h2>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pw1">
            New password
          </label>
          <input id="pw1" type="password" className="adm-input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="pw2">
            Repeat new password
          </label>
          <input id="pw2" type="password" className="adm-input" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="adm-form__foot">
          <button className="adm-btn" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Change password"}
          </button>
        </div>
      </form>
      <Logins />
    </section>
  );
}
