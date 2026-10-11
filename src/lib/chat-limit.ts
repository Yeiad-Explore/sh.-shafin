import { createHash, randomUUID } from "node:crypto";
import { createServerClient } from "./supabase";

/** Questions each visitor may ask per day (Dhaka time). */
export const USER_DAILY_LIMIT = 10;
/** Ceiling per IP, so clearing cookies doesn't reset the limit. Higher than the user limit because mobile carriers share IPs. */
const IP_DAILY_LIMIT = 40;
/** Site-wide cost guard. */
const GLOBAL_DAILY_LIMIT = 500;

export const CHAT_COOKIE = "shs_chat";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Visitor {
  id: string;
  isNew: boolean;
  ip: string;
}

export function identify(req: Request): Visitor {
  const raw = req.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${CHAT_COOKIE}=([^;]+)`))?.[1];
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return raw && UUID.test(raw) ? { id: raw, isNew: false, ip } : { id: randomUUID(), isNew: true, ip };
}

export function visitorCookie(v: Visitor): string | null {
  if (!v.isNew) return null;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${CHAT_COOKIE}=${v.id}; Path=/api/chat; Max-Age=31536000; HttpOnly; SameSite=Strict${secure}`;
}

export type LimitResult = { allowed: true; remaining: number } | { allowed: false; remaining: number; reason: "user" | "ip" | "global" | "error" };

const hash = (secret: string, kind: string, value: string) => createHash("sha256").update(`${secret}:${kind}:${value}`).digest("hex").slice(0, 32);

/** Counts are kept in Supabase so the limit holds across every server instance. Fails closed. */
export async function chatLimit(v: Visitor, mode: "consume" | "peek" | "refund"): Promise<LimitResult> {
  const secret = process.env.CHAT_LIMITER_SECRET;
  const sb = createServerClient();
  if (!secret || !sb) return { allowed: false, remaining: 0, reason: "error" };
  const { data, error } = await sb.rpc("chat_consume", {
    p_secret: secret,
    p_user: hash(secret, "u", v.id),
    p_ip: hash(secret, "ip", v.ip),
    p_mode: mode,
    p_user_limit: USER_DAILY_LIMIT,
    p_ip_limit: IP_DAILY_LIMIT,
    p_global_limit: GLOBAL_DAILY_LIMIT,
  });
  if (error || !data) {
    console.error("[chat] limiter unavailable", error?.message);
    return { allowed: false, remaining: 0, reason: "error" };
  }
  return data as LimitResult;
}
