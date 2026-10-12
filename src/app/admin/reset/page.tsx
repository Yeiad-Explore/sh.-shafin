"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getBrowserClient } from "@/lib/supabase";
import Logo from "@/components/site/Logo";

// Opened from the "Reset your admin password" email. Supabase puts a one-time recovery
// session in the URL hash; the browser client picks it up, then the new password is saved
// with updateUser and the admin lands on the dashboard.

type State = "checking" | "ready" | "invalid" | "done";

export default function ResetPassword() {
  const sb = getBrowserClient();
  const [state, setState] = useState<State>("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sb) return;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL hash on mount
      setState("invalid");
      return;
    }
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setState((s) => (s === "checking" ? "ready" : s));
    });
    sb.auth.getSession().then(({ data }) => {
      setState((s) => (s === "checking" ? (data.session ? "ready" : "invalid") : s));
      if (data.session) history.replaceState(null, "", window.location.pathname);
    });
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sb) return;
    if (pw.length < 10) return setMsg("Use at least 10 characters.");
    if (pw !== pw2) return setMsg("The two passwords don't match.");
    setBusy(true);
    setMsg(null);
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg(error.message);
    setState("done");
    setTimeout(() => window.location.replace("/admin"), 1200);
  };

  return (
    <main className="adm-login">
      <form className="adm-login__card" onSubmit={submit}>
        <div className="adm-mono adm-login__mark"><Logo size={18} /> S.H.S — Admin</div>
        <h1>New password</h1>

        {state === "checking" && <p className="adm-muted adm-mono">Checking the link…</p>}

        {state === "invalid" && (
          <>
            <p className="adm-login__msg" role="alert">
              This reset link has expired or was already used. Links work once, for 1 hour.
            </p>
            <a className="adm-btn adm-btn--block" href="/admin#forgot">
              Send a new link
            </a>
          </>
        )}

        {state === "ready" && (
          <>
            <div className="adm-field">
              <label className="adm-label" htmlFor="pw1">
                New password
              </label>
              <input id="pw1" type="password" className="adm-input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
              <span className="adm-help">At least 10 characters.</span>
            </div>
            <div className="adm-field">
              <label className="adm-label" htmlFor="pw2">
                Repeat new password
              </label>
              <input id="pw2" type="password" className="adm-input" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
            </div>
            {msg && (
              <p className="adm-login__msg" role="alert">
                {msg}
              </p>
            )}
            <button className="adm-btn adm-btn--block" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save and sign in"}
            </button>
          </>
        )}

        {state === "done" && (
          <p className="adm-login__msg" role="status">
            Password changed. Opening the dashboard…
          </p>
        )}
      </form>
    </main>
  );
}
