import { cacheLife, cacheTag } from "next/cache";
import { createServerClient } from "./supabase";
import { fallbackData } from "./fallback";
import type { SiteData, SiteSettings } from "./types";

export const SITE_TAG = "site";

/** Every published row the public page needs, in one cached read. Admin saves call updateTag(SITE_TAG). */
export async function getSiteData(): Promise<SiteData> {
  "use cache";
  cacheTag(SITE_TAG);
  cacheLife("minutes");

  const sb = createServerClient();
  if (!sb) return fallbackData;

  const ordered = (table: string) =>
    sb.from(table).select("*").eq("published", true).order("sort_order", { ascending: true });

  try {
    const [settings, education, experience, specialties, subjects, courses, batches, trialSlots, testimonials, results, faqs] =
      await Promise.all([
        sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
        ordered("education"),
        ordered("experience"),
        ordered("specialties"),
        ordered("subjects"),
        ordered("courses"),
        ordered("batches"),
        ordered("trial_slots"),
        ordered("testimonials").eq("consent", true),
        ordered("results"),
        ordered("faqs"),
      ]);

    if (settings.error || subjects.error) throw settings.error ?? subjects.error;

    const s = (settings.data ?? fallbackData.settings) as SiteSettings;
    return {
      settings: {
        ...fallbackData.settings,
        ...s,
        sections: { ...fallbackData.settings.sections, ...(s.sections ?? {}) },
        section_order: s.section_order?.length ? s.section_order : fallbackData.settings.section_order,
      },
      education: education.data ?? [],
      experience: experience.data ?? [],
      specialties: specialties.data ?? [],
      subjects: subjects.data ?? [],
      courses: courses.data ?? [],
      batches: batches.data ?? [],
      trialSlots: trialSlots.data ?? [],
      testimonials: testimonials.data ?? [],
      results: results.data ?? [],
      faqs: faqs.data ?? [],
    };
  } catch (err) {
    console.error("[getSiteData] falling back to static content", err);
    return fallbackData;
  }
}
