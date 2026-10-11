// Supabase Edge Function: emails Shafin when a new enrollment row arrives.
// Called by the database trigger in migrations/0002_enrollment_email.sql.
//
// Secrets (supabase secrets set …):
//   RESEND_API_KEY     — from resend.com (free tier is enough)
//   NOTIFY_TO          — where alerts go, e.g. shafin@example.com
//   NOTIFY_FROM        — a sender on a domain verified in Resend, e.g. "Website <hello@yourdomain.com>"
//   WEBHOOK_SECRET     — any long random string; the same value goes into the trigger SQL

interface Enrollment {
  id: string;
  kind: "enroll" | "trial";
  student_name: string;
  class: string | null;
  institution: string | null;
  subjects: string[];
  mode: string | null;
  preferred_time: string | null;
  parent_phone: string;
  message: string | null;
  course_id: string | null;
  created_at: string;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { record } = (await req.json()) as { record: Enrollment };
  const key = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("NOTIFY_TO");
  const from = Deno.env.get("NOTIFY_FROM") ?? "S.H. Shafin website <onboarding@resend.dev>";
  if (!key || !to) {
    console.log("notify-enrollment: RESEND_API_KEY or NOTIFY_TO not set; skipping", record.id);
    return Response.json({ skipped: true });
  }

  // SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected into every Edge Function.
  let course: string | null = null;
  if (record.course_id) {
    const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/courses?id=eq.${record.course_id}&select=title`, {
      headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
    });
    if (r.ok) course = ((await r.json()) as { title: string }[])[0]?.title ?? null;
  }

  const digits = record.parent_phone.replace(/\D/g, "");
  const wa = `https://wa.me/${digits.startsWith("01") && digits.length === 11 ? `88${digits}` : digits}`;
  const rows: [string, unknown][] = [
    ["Type", record.kind === "trial" ? "Free trial" : "Enrollment"],
    ["Student", record.student_name],
    ["Class", record.class],
    ["School / college", record.institution],
    ["Course", course],
    ["Subjects", record.subjects?.join(", ")],
    ["Mode", record.mode],
    ["Preferred time", record.preferred_time],
    ["Parent's phone", record.parent_phone],
    ["Message", record.message],
  ];
  const html = `
    <div style="font-family:Georgia,serif;color:#16150F;background:#F3EFE4;padding:24px">
      <p style="font-family:monospace;letter-spacing:.1em;font-size:12px;margin:0 0 12px">RECEIVED — NEW ${record.kind === "trial" ? "FREE TRIAL" : "ENROLLMENT"} REQUEST</p>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        ${rows
          .filter(([, v]) => v)
          .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#55534B">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`)
          .join("")}
      </table>
      <p style="margin-top:18px"><a href="${wa}">Reply on WhatsApp</a> · <a href="tel:${esc(record.parent_phone)}">Call</a></p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${record.kind === "trial" ? "Free trial" : "Enrollment"} request — ${record.student_name}${record.class ? `, ${record.class}` : ""}`,
      html,
    }),
  });
  if (!res.ok) {
    console.error("notify-enrollment: Resend error", res.status, await res.text());
    return new Response("Email failed", { status: 502 });
  }
  return Response.json({ sent: true });
});
