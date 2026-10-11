// Supabase Edge Function: lets a signed-in admin list, add and remove admin login emails.
// Called from /admin → Account. Creating auth users needs the service-role key, so this
// can't run in the browser. Deployed with --no-verify-jwt; the caller is checked below.
//
// Body: { action: "list" } | { action: "add", email, password } | { action: "remove", user_id }
//
// The master login (kabid.snit@gmail.com) is hidden from the list and can't be removed here,
// so there's always one way in. Its password is only in ADMIN_CREDENTIALS.local.md.

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MASTER_ID = "d5cd7e9b-e36d-46e5-93dd-645f29d94440";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });
const fail = (error: string, status = 400) => json({ error }, status);

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function adminIds(): Promise<string[]> {
  const { data, error } = await sb.from("admins").select("user_id");
  if (error) throw error;
  return data.map((r) => r.user_id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return fail("Method not allowed", 405);

  const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return fail("Sign in first", 401);
  const { data: caller } = await sb.auth.getUser(jwt);
  if (!caller.user) return fail("Sign in first", 401);

  try {
    const ids = await adminIds();
    if (!ids.includes(caller.user.id)) return fail("Admins only", 403);

    const body = await req.json().catch(() => ({}));

    if (body.action === "list") {
      const users = await Promise.all(ids.filter((id) => id !== MASTER_ID).map((id) => sb.auth.admin.getUserById(id)));
      return json({
        logins: users
          .map((u) => u.data.user)
          .filter((u) => u !== null)
          .map((u) => ({ user_id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null }))
          .sort((a, b) => a.created_at.localeCompare(b.created_at)),
      });
    }

    if (body.action === "add") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("That email doesn't look right");
      if (password.length < 10) return fail("Use at least 10 characters for the password");

      const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) {
        const taken = /already|registered|exists/i.test(error.message);
        return fail(taken ? "That email already has an account" : error.message);
      }
      const { error: insErr } = await sb.from("admins").insert({ user_id: data.user.id });
      if (insErr) {
        await sb.auth.admin.deleteUser(data.user.id);
        throw insErr;
      }
      return json({ ok: true });
    }

    if (body.action === "remove") {
      const id = String(body.user_id ?? "");
      if (!ids.includes(id) || id === MASTER_ID) return fail("That login isn't an admin");
      if (id === caller.user.id) return fail("You can't remove the login you're signed in with");
      // admins.user_id cascades, so deleting the auth user removes the admin row too
      const { error } = await sb.auth.admin.deleteUser(id);
      if (error) throw error;
      return json({ ok: true });
    }

    return fail("Unknown action");
  } catch (e) {
    console.error("admin-logins:", e);
    return fail("Something went wrong — try again", 500);
  }
});
