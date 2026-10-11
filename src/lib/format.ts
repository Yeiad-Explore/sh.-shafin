import type { Batch, ClassLevel, Mode, SubjectSlug } from "./types";

export const SUBJECT_VAR: Record<SubjectSlug, string> = {
  biology: "var(--bio)",
  physics: "var(--phy)",
  chemistry: "var(--chem)",
  math: "var(--math)",
};

export const SUBJECT_ORDER: SubjectSlug[] = ["biology", "chemistry", "physics", "math"];

export const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"] as const;
export const DAY_LONG: Record<string, string> = {
  Sat: "Saturday",
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
};

export function fmtTime(t: string | null | undefined): string {
  if (!t) return "";
  const [hRaw, m] = t.split(":");
  const h = Number(hRaw);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

export function fmtClass(level: ClassLevel): string {
  switch (level) {
    case "9-10":
      return "Class 9–10 · SSC";
    case "11-12":
      return "Class 11–12 · HSC";
    case "10":
      return "Class 10 · SSC";
    case "12":
      return "Class 12 · HSC";
  }
}

export function classGroup(level: ClassLevel): "9-10" | "11-12" {
  return level === "9-10" || level === "10" ? "9-10" : "11-12";
}

export function fmtMode(mode: Mode | "online" | "offline"): string {
  return mode === "both" ? "Online & offline" : mode === "online" ? "Online" : "Offline";
}

export function fmtFee(fee: number | null, note: string | null): string {
  if (fee != null) return `৳${fee.toLocaleString("en-IN")} / month`;
  return note || "Ask for fee";
}

export function fmtDate(d: string | null): string {
  if (!d) return "";
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export type SeatStatus = "open" | "few" | "full" | "waitlist";

/** Badges are computed, not typed: seats taken ÷ seats total decides the label. */
export function seatStatus(b: Pick<Batch, "seats_taken" | "seats_total" | "waitlist">): SeatStatus {
  const left = b.seats_total - b.seats_taken;
  if (left <= 0) return b.waitlist ? "waitlist" : "full";
  if (b.seats_taken / b.seats_total >= 0.75) return "few";
  return "open";
}

export const STATUS_LABEL: Record<SeatStatus, string> = {
  open: "Open",
  few: "Few seats",
  full: "Full",
  waitlist: "Waitlist",
};

export function seatsLeft(b: Pick<Batch, "seats_taken" | "seats_total">): number {
  return Math.max(0, b.seats_total - b.seats_taken);
}

export function waLink(num: string | null | undefined, text?: string): string | null {
  if (!num) return null;
  const digits = num.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telLink(num: string | null | undefined): string | null {
  if (!num) return null;
  return `tel:${num.replace(/[^\d+]/g, "")}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
