"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase";
import { AdminProvider } from "@/components/admin/ctx";
import { NAV, TABLES } from "@/components/admin/config";
import TableManager from "@/components/admin/TableManager";
import Enrollments from "@/components/admin/Enrollments";
import SiteSettings from "@/components/admin/SiteSettings";
import Dashboard from "@/components/admin/Dashboard";
import Account from "@/components/admin/Account";

function Login({ onError }: { onError: string | null }) {
  const sb = getBrowserClient()!;
  const [mode, setMode] = useState<"signin" | "forgot">(() => (typeof window !== "undefined" && window.location.hash === "#forgot" ? "forgot" : "signin"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(onError);

  const switchMode = (m: "signin" | "forgot") => {
    setMode(m);
    setMsg(null);
    history.replaceState(null, "", m === "forgot" ? "#forgot" : window.location.pathname);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMsg(error.message === "Invalid login credentials" ? "Email or password is wrong." : error.message);
  };

  const magic = async () => {
    if (!email.trim()) return setMsg("Write your email first.");
    setBusy(true);
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    setMsg(error ? error.message : "Check your inbox — the sign-in link is on its way.");
  };

  const forgot = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/reset` });
    setBusy(false);
    // same answer whether or not the email has a login, so the form can't be used to find admin emails
    if (error && error.status === 429) return setMsg("Too many requests. Wait a minute, then ask again.");
    setMsg("If that email has an admin login, a reset link is on its way. Check your inbox (and spam). The link works once, for 1 hour.");
  };

  if (mode === "forgot") {
    return (
      <main className="adm-login">
        <form className="adm-login__card" onSubmit={forgot}>
          <div className="adm-mono adm-login__mark">● S.H.S — Admin</div>
          <h1>Reset password</h1>
          <p className="adm-muted" style={{ margin: 0 }}>
            Write the email you sign in with. We&apos;ll send a link to choose a new password.
          </p>
          <div className="adm-field">
            <label className="adm-label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="adm-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </div>
          {msg && (
            <p className="adm-login__msg" role="status">
              {msg}
            </p>
          )}
          <button className="adm-btn adm-btn--block" type="submit" disabled={busy || !email.trim()}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <button className="adm-login__link" type="button" onClick={() => switchMode("signin")}>
            ← Back to sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="adm-login">
      <form className="adm-login__card" onSubmit={submit}>
        <div className="adm-mono adm-login__mark">● S.H.S — Admin</div>
        <h1>Sign in</h1>
        <div className="adm-field">
          <label className="adm-label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="adm-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </div>
        <div className="adm-field">
          <label className="adm-label" htmlFor="password">
            Password
          </label>
          <input id="password" type="password" className="adm-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        {msg && (
          <p className="adm-login__msg" role="alert">
            {msg}
          </p>
        )}
        <button className="adm-btn adm-btn--block" type="submit" disabled={busy || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <button className="adm-btn adm-btn--ghost adm-btn--block" type="button" onClick={magic} disabled={busy}>
          Email me a sign-in link instead
        </button>
        <button className="adm-login__link" type="button" onClick={() => switchMode("forgot")}>
          Forgot password?
        </button>
      </form>
    </main>
  );
}

export default function AdminPage() {
  const sb = getBrowserClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [view, setView] = useState("dashboard");
  const [newCount, setNewCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    const fromHash = window.location.hash.replace("#", "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL hash on mount
    if (fromHash && NAV.some((n) => n.key === fromHash)) setView(fromHash);
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!sb || !session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the session ends
      setIsAdmin(null);
      return;
    }
    sb.rpc("is_admin").then(({ data }) => setIsAdmin(!!data));
    sb.from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("status", "new")
      .then(({ count }) => setNewCount(count ?? 0));
  }, [sb, session]);

  const go = (k: string) => {
    setView(k);
    setMenuOpen(false);
    history.replaceState(null, "", `#${k}`);
    window.scrollTo({ top: 0 });
  };

  if (!sb) {
    return (
      <main className="adm-login">
        <div className="adm-login__card">
          <h1>Supabase isn&apos;t configured</h1>
          <p className="adm-muted">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then reload.</p>
        </div>
      </main>
    );
  }
  if (session === undefined) return <main className="adm-login adm-mono">Loading…</main>;
  if (!session) return <Login onError={null} />;
  if (isAdmin === null) return <main className="adm-login adm-mono">Checking access…</main>;
  if (!isAdmin) {
    return (
      <main className="adm-login">
        <div className="adm-login__card">
          <h1>No access</h1>
          <p className="adm-muted">{session.user.email} isn&apos;t an admin of this site.</p>
          <button className="adm-btn" type="button" onClick={() => sb.auth.signOut()}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  const tableDef = TABLES[view];

  return (
    <AdminProvider sb={sb} session={session}>
      <div className="adm-shell">
        <aside className={`adm-side ${menuOpen ? "is-open" : ""}`}>
          <div className="adm-side__top">
            <span className="adm-mono adm-side__mark">● S.H.S</span>
            <button type="button" className="adm-icon adm-side__menu" aria-expanded={menuOpen} aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
              ☰
            </button>
          </div>
          <nav aria-label="Admin">
            <ul>
              {NAV.map((n) => (
                <li key={n.key}>
                  <button type="button" className={`adm-nav ${view === n.key ? "is-active" : ""}`} aria-current={view === n.key ? "page" : undefined} onClick={() => go(n.key)}>
                    {n.label}
                    {n.key === "enrollments" && newCount > 0 && <span className="adm-badge">{newCount}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="adm-side__foot">
            <a href="/" target="_blank" rel="noopener noreferrer" className="adm-nav">
              View site ↗
            </a>
            <button type="button" className="adm-nav" onClick={() => sb.auth.signOut()}>
              Sign out
            </button>
          </div>
        </aside>
        <main className="adm-main">
          {view === "dashboard" && <Dashboard go={go} />}
          {view === "enrollments" && <Enrollments onCount={setNewCount} />}
          {view === "site" && <SiteSettings />}
          {view === "account" && <Account />}
          {tableDef && <TableManager key={view} def={tableDef} />}
        </main>
      </div>
    </AdminProvider>
  );
}
