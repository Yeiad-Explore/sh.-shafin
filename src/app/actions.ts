"use server";

import { updateTag } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { SITE_TAG } from "@/lib/data";

/** Called by /admin after every save so the public page shows the change on its next load. */
export async function refreshSite(accessToken: string): Promise<{ ok: boolean }> {
  const sb = createServerClient(accessToken);
  if (!sb) return { ok: false };
  const { data: userData, error } = await sb.auth.getUser(accessToken);
  if (error || !userData.user) return { ok: false };
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return { ok: false };
  updateTag(SITE_TAG);
  return { ok: true };
}
