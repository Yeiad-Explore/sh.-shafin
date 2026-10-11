import { DAY_LONG, fmtClass, fmtDate, fmtFee, fmtMode, fmtTime, seatStatus, seatsLeft, STATUS_LABEL } from "./format";
import type { SiteData } from "./types";

/** Turns the published site content into the facts the chat assistant is allowed to use. */
export function buildChatContext(data: SiteData): string {
  const { settings: s } = data;
  const subjectName = new Map(data.subjects.map((x) => [x.id, x.name]));
  const courseTitle = new Map(data.courses.map((c) => [c.id, c.title]));
  const days = (d: string[]) => d.map((x) => DAY_LONG[x] ?? x).join(", ");
  const out: string[] = [];

  out.push(`## About the teacher\n${s.bio}`);
  if (s.philosophy) out.push(`Teaching philosophy: ${s.philosophy}`);
  if (data.education.length)
    out.push(
      "Education:\n" +
        data.education.map((e) => `- ${e.degree}${e.concentration ? ` (${e.concentration})` : ""}, ${e.institution}, ${e.year}`).join("\n"),
    );
  if (data.experience.length)
    out.push(
      "Experience:\n" +
        data.experience
          .map((x) => `- ${x.role}${x.institution ? `, ${x.institution}` : ""}, ${x.start_year}–${x.end_year ?? "present"}${x.description ? `: ${x.description}` : ""}`)
          .join("\n"),
    );
  if (data.specialties.length) out.push(`Specialties: ${data.specialties.map((x) => x.label).join(", ")}`);

  if (data.subjects.length)
    out.push(
      "## Subjects\n" +
        data.subjects
          .map(
            (x) =>
              `- ${x.name}${x.is_specialty ? " (main specialty)" : ""}${x.tagline ? `: ${x.tagline}` : ""}` +
              (x.topics_ssc.length ? `\n  SSC topics: ${x.topics_ssc.join(", ")}` : "") +
              (x.topics_hsc.length ? `\n  HSC topics: ${x.topics_hsc.join(", ")}` : ""),
          )
          .join("\n"),
    );

  out.push(
    "## Courses\n" +
      (data.courses.length
        ? data.courses
            .map((c) => {
              const lines = [
                `### ${c.title}`,
                `Class: ${fmtClass(c.class_level)} · Subject: ${(c.subject_id && subjectName.get(c.subject_id)) || "Mixed"} · Mode: ${fmtMode(c.mode)}`,
                `Fee: ${fmtFee(c.fee, c.fee_note)}${c.duration ? ` · Duration: ${c.duration}` : ""}`,
              ];
              if (c.summary) lines.push(c.summary);
              if (c.audience) lines.push(`Who it's for: ${c.audience}`);
              if (c.includes.length) lines.push(`Includes: ${c.includes.join("; ")}`);
              if (c.syllabus.length) lines.push(`Syllabus: ${c.syllabus.map((ch) => `${ch.chapter} (${ch.topics.join(", ")})`).join("; ")}`);
              for (const f of c.faqs) lines.push(`Q: ${f.q} A: ${f.a}`);
              return lines.join("\n");
            })
            .join("\n\n")
        : "No courses are listed yet. Ask the visitor to send a message through the contact form."),
  );

  if (data.batches.length)
    out.push(
      "## Batches (live seat counts)\n" +
        data.batches
          .map((b) => {
            const st = seatStatus(b);
            return `- ${b.name} — ${courseTitle.get(b.course_id) ?? "course"}: ${days(b.days)}, ${fmtTime(b.start_time)}–${fmtTime(b.end_time)}, ${fmtMode(b.mode)}. ${STATUS_LABEL[st]}${st === "open" || st === "few" ? ` (${seatsLeft(b)} of ${b.seats_total} seats left)` : ""}${b.start_date ? `. Starts ${fmtDate(b.start_date)}` : ""}`;
          })
          .join("\n"),
    );

  if (data.trialSlots.length)
    out.push(
      "## Free trial class slots\n" + data.trialSlots.map((t) => `- ${DAY_LONG[t.day] ?? t.day} ${fmtTime(t.start_time)}, ${fmtMode(t.mode)}`).join("\n"),
    );

  if (data.results.length) out.push("## Results\n" + data.results.map((r) => `- ${r.year} ${r.exam}: ${r.label} — ${r.value}${r.suffix ?? ""}`).join("\n"));

  if (data.faqs.length) out.push("## FAQ\n" + data.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n"));

  const contact = [
    s.teaching_place && `Teaching place: ${s.teaching_place}`,
    s.address && `Address: ${s.address}`,
    s.phone && `Phone: ${s.phone}`,
    s.whatsapp && `WhatsApp: ${s.whatsapp}`,
    s.email && `Email: ${s.email}`,
    s.payment_methods.length && `Payment methods: ${s.payment_methods.join(", ")}`,
  ].filter(Boolean);
  out.push("## Contact\n" + (contact.length ? contact.join("\n") : "Use the enrollment form in the Contact section of the page."));

  if (s.notice_active && s.notice) out.push(`## Current notice\n${s.notice}`);

  return out.join("\n\n");
}
