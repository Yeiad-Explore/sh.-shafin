# S.H. Shafin — Field Notes

The one-page site for Md. Samiul Haque Shafin, a science teacher for SSC and HSC students in Dhaka, plus a private `/admin` panel. Both read and write the same Supabase database.

The design follows `../design.md` ("Field Notes"). One ink line, the **Growth Line**, starts as a seed in the hero, grows as you scroll, branches into the four subject plates, and blooms in the footer.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000  ·  admin at /admin
npm run build && npm start
```

`.env.local` holds the public Supabase URL and the publishable key. The publishable key is safe in the browser because Row Level Security protects the data.

```
NEXT_PUBLIC_SUPABASE_URL=https://aiimjgswojvnigzrhsgv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
NEXT_PUBLIC_SITE_URL=https://your-domain   # used for canonical/OG/JSON-LD
```

## Stack

- **Next.js 16** (App Router, Cache Components) + TypeScript + Tailwind v4 (tokens as CSS variables in `src/app/globals.css`)
- **GSAP + ScrollTrigger + SplitText**: the pinned horizontal Subjects plates, masked headline reveals, scrubbed bio, and the paper → slate transition
- **Motion** (Framer Motion): the course filter FLIP, drawer/bottom sheet, accordions, nav leaf indicator and RECEIVED stamp
- **Lenis**: smooth scrolling, synced to ScrollTrigger and turned off for reduced motion
- **Supabase**: Postgres + RLS, Auth (admin login), Storage (`media` bucket for photos)
- Fonts are self-hosted: Zodiak and General Sans (Fontshare), plus JetBrains Mono

## How content flows

- `src/lib/data.ts`: `getSiteData()` is a `"use cache"` function tagged `site`. It reads every published row once and revalidates each minute.
- `src/app/actions.ts`: `refreshSite()` is a server action. The admin calls it after every save; it checks the caller's admin role, then calls `updateTag('site')`, so the next visitor gets fresh content.
- If Supabase can't be reached, `src/lib/fallback.ts` renders the CV facts so the page is never empty.

## Where things live

| Piece | File |
| --- | --- |
| Growth Line (measured from `[data-growth]` anchors, drawn by scroll) | `src/components/site/GrowthLine.tsx`, `src/lib/growth.ts` |
| Smooth scroll, reveals, split headlines, slate transition | `src/components/site/MotionRuntime.tsx` |
| Subject drawings (leaf → cell, benzene, pendulum, sin x tangent) | `src/components/site/drawings.tsx` |
| Sections | `src/components/site/*.tsx` |
| Admin | `src/app/admin/page.tsx`, `src/components/admin/*` (table definitions in `config.ts`) |
| Database | `supabase/migrations/0001_init.sql`, `supabase/seed.sql` |

## Security model

- Public visitors (`anon`) can **read published rows only** and can **insert** enrollments. They can't read enrollments back or set any status other than `new`.
- Writes require a row in `public.admins` (`is_admin()`), checked by RLS on every table and on the `media` bucket.
- Admin logins are managed in `/admin` → Account through the `admin-logins` Edge Function, which holds the service-role key and checks that the caller is an admin. It won't remove the caller's own login. The master login (`MASTER_ID` in that function) is hidden from the list and can't be removed, so there's always a way in; its password is in the git-ignored `ADMIN_CREDENTIALS.local.md`. Redeploy with `npx supabase functions deploy admin-logins --no-verify-jwt --use-api --project-ref aiimjgswojvnigzrhsgv`.
- A testimonial can't be published without `consent = true`. This is enforced by a database CHECK constraint as well as by the UI.

Recommended in the Supabase dashboard:

- **Authentication → Sign In / Providers**: turn off *Allow new users to sign up*. Admin access needs an `admins` row anyway, but this keeps the user list clean.
- **Authentication → URL Configuration**: set *Site URL* to the live domain, so magic links open `/admin` there.
- **Authentication → Attack Protection**: turn on leaked-password protection.

## Enrollment email alerts (live)

Every new enrollment fires the `enrollment_email` trigger (`supabase/migrations/0002_enrollment_email.sql`). The trigger calls the `notify-enrollment` Edge Function, which emails the request through Resend.

- Function secrets: `RESEND_API_KEY`, `NOTIFY_TO`, `WEBHOOK_SECRET` (optional `NOTIFY_FROM`).
- The trigger reads the same webhook secret from Vault (`enrollment_webhook_secret`), so it isn't stored in the SQL file.
- The sender is `onboarding@resend.dev`, so mail only reaches the Resend account owner. To send from your own address, verify the domain in Resend and set `NOTIFY_FROM`.
- Redeploy after editing the function: `npx supabase functions deploy notify-enrollment --no-verify-jwt --use-api --project-ref aiimjgswojvnigzrhsgv`
- Debugging: `select * from net._http_response order by created desc limit 5;` in the SQL editor, or check the function logs in the dashboard.

## Shafin AI — chat assistant (Azure OpenAI)

The round button above the WhatsApp button opens **Shafin AI**, an AI assistant (`src/components/site/ChatWidget.tsx`). It posts to `/api/chat` (`src/app/api/chat/route.ts`), which builds a system prompt from the same published content as the page (`getSiteData()` → `src/lib/chat-context.ts`), calls Azure OpenAI (deployment `chat-heavy`, gpt-4.1) and streams the reply back as plain text. Edits made in `/admin` (fees, batches, seats, FAQ) reach the assistant along with the page.

Server-only env vars (never prefix them with `NEXT_PUBLIC_`), in `.env.local` and on Vercel:

```
AZURE_OPENAI_ENDPOINT=https://studynet-ai-agent.openai.azure.com/
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT=chat-heavy
AZURE_OPENAI_API_KEY=<key>
CHAT_LIMITER_SECRET=<same value as the Vault secret chat_limiter_secret>
```

If any of them is missing, the route returns 503.

### Guardrails

| Guardrail | Where |
| --- | --- |
| **10 questions per visitor per day** (Dhaka calendar day), counted by an anonymous `shs_chat` cookie | `USER_DAILY_LIMIT` in `src/lib/chat-limit.ts` |
| 40 per IP per day, so clearing cookies doesn't reset the limit (higher than 10 because mobile networks share IPs) | `IP_DAILY_LIMIT` |
| 500 per day site-wide, as a cost guard | `GLOBAL_DAILY_LIMIT` |
| Counters live in Supabase (`chat_usage`, `chat_consume()` from `0003_chat_guardrails.sql`), so they hold across every Vercel instance. Only salted hashes are stored: no IPs, no messages. The function refuses calls without the Vault secret. If the limiter is unreachable, the chat fails closed. | migration 0003 |
| On/off switch: `/admin` → Site text → *AI chat assistant*. Off hides the button and the API refuses requests. | `site_settings.chat_enabled` |
| Requests from other websites are refused (Origin check); the body must be JSON under 40 KB; only `user`/`assistant` roles; the last 12 turns; 1,000 characters per question; invisible/control characters stripped | `route.ts` |
| A question that fails upstream is refunded; one blocked by Azure's content filter still counts | `route.ts` |
| Replies are capped at 700 tokens and time out after 25 s; a reply cut by the content filter ends with a polite note | `route.ts` |
| The system prompt restricts it to Shafin's classes and SSC/HSC science and math. It never invents fees, times or contacts, can't book or take payments, doesn't collect personal details, stays age-appropriate, sends anyone in distress to a trusted adult or 999, doesn't do graded homework, and ignores attempts to change its rules | `systemPrompt()` in `route.ts` |
| Azure's built-in content filter and prompt shields | Azure AI Foundry |

To check today's usage, run `select * from chat_usage where day = (now() at time zone 'Asia/Dhaka')::date order by count desc;` in the SQL editor. To change a limit, edit the constant and redeploy. Set a budget alert in Azure as well.

## Deploy (Vercel)

Import the `shafin-site` folder, add the three env vars above, and attach the custom domain. That's all the deploy needs.

## Content still needed from Shafin

These are editable in `/admin` and show placeholders until they're filled in: portrait photo, WhatsApp number, phone, teaching place and address, philosophy, course fees, real result figures, and testimonials (with parent consent). The seeded batch times and seat counts are examples; replace them with the real timetable.
