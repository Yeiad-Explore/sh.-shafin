"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { refreshSite } from "@/app/actions";

export interface Lookup {
  id: string;
  label: string;
  slug?: string;
}

interface AdminCtx {
  sb: SupabaseClient;
  session: Session;
  courses: Lookup[];
  subjects: Lookup[];
  reloadLookups: () => Promise<void>;
  toast: (msg: string, kind?: "ok" | "err") => void;
  /** call after every successful write: refreshes the public page cache and shows the toast */
  saved: (msg?: string) => Promise<void>;
}

const Ctx = createContext<AdminCtx | null>(null);

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin outside provider");
  return c;
}

export function AdminProvider({ sb, session, children }: { sb: SupabaseClient; session: Session; children: React.ReactNode }) {
  const [courses, setCourses] = useState<Lookup[]>([]);
  const [subjects, setSubjects] = useState<Lookup[]>([]);
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: "ok" | "err" }[]>([]);

  const reloadLookups = useCallback(async () => {
    const [c, s] = await Promise.all([
      sb.from("courses").select("id,title").order("sort_order"),
      sb.from("subjects").select("id,name,slug").order("sort_order"),
    ]);
    setCourses((c.data ?? []).map((r) => ({ id: r.id, label: r.title })));
    setSubjects((s.data ?? []).map((r) => ({ id: r.id, label: r.name, slug: r.slug })));
  }, [sb]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount; state is set after the request resolves
    reloadLookups();
  }, [reloadLookups]);

  const toast = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "err" ? 6000 : 2600);
  }, []);

  const saved = useCallback(
    async (msg = "Saved — live on the site") => {
      toast(msg);
      try {
        const { data } = await sb.auth.getSession();
        if (data.session) await refreshSite(data.session.access_token);
      } catch (e) {
        console.error(e);
      }
    },
    [sb, toast],
  );

  const value = useMemo(
    () => ({ sb, session, courses, subjects, reloadLookups, toast, saved }),
    [sb, session, courses, subjects, reloadLookups, toast, saved],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="adm-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`adm-toast adm-toast--${t.kind}`}>
            {t.kind === "ok" ? "✓ " : "! "}
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
