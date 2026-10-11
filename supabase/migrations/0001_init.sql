-- S.H. Shafin — Field Notes site
-- Schema, Row Level Security and storage for the public page + /admin panel.

create extension if not exists pgcrypto;

-- ───────────────────────────── admin role ─────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admins read self" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────────────────────── content tables ─────────────────────────────
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  hero_headline text not null default 'Science, taught until it clicks.',
  hero_subline text not null default 'Biology, Physics, Chemistry and Math for SSC and HSC students in Dhaka.',
  bio text not null default '',
  philosophy text not null default '',
  photo_url text,
  phone text,
  whatsapp text,
  email text,
  address text,
  teaching_place text,
  facebook text,
  youtube text,
  instagram text,
  payment_methods text[] not null default '{}',
  notice text,
  notice_active boolean not null default false,
  sections jsonb not null default '{"about":true,"subjects":true,"courses":true,"schedule":true,"results":true,"faq":true,"contact":true}',
  section_order text[] not null default '{about,subjects,courses,schedule,results,faq,contact}',
  updated_at timestamptz not null default now()
);

create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  degree text not null,
  institution text not null,
  year text not null,
  concentration text,
  notes text,
  published boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  institution text,
  start_year int not null,
  end_year int,
  description text,
  published boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.specialties (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  subject text check (subject in ('biology','physics','chemistry','math')),
  published boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('biology','physics','chemistry','math')),
  name text not null,
  colour text not null,
  tagline text,
  topics_ssc text[] not null default '{}',
  topics_hsc text[] not null default '{}',
  is_specialty boolean not null default false,
  published boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  class_level text not null check (class_level in ('9-10','11-12','10','12')),
  subject_id uuid references public.subjects (id) on delete set null,
  mode text not null default 'both' check (mode in ('online','offline','both')),
  duration text,
  fee int,
  fee_note text,
  summary text,
  audience text,
  syllabus jsonb not null default '[]',
  includes text[] not null default '{}',
  faqs jsonb not null default '[]',
  published boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  name text not null,
  days text[] not null default '{}',
  start_time time not null,
  end_time time not null,
  mode text not null default 'offline' check (mode in ('online','offline')),
  seats_total int not null default 12 check (seats_total > 0),
  seats_taken int not null default 0 check (seats_taken >= 0),
  waitlist boolean not null default true,
  start_date date,
  published boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.trial_slots (
  id uuid primary key default gen_random_uuid(),
  day text not null check (day in ('Sat','Sun','Mon','Tue','Wed','Thu','Fri')),
  start_time time not null,
  mode text not null default 'online' check (mode in ('online','offline')),
  published boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'student' check (role in ('student','parent')),
  class_label text,
  quote text not null,
  photo_url text,
  consent boolean not null default false,
  published boolean not null default false,
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  -- a testimonial can never be live without parent consent
  constraint testimonial_consent check (published = false or consent = true)
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  exam text not null,
  label text not null,
  value int not null,
  suffix text,
  published boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  published boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'enroll' check (kind in ('enroll','trial')),
  student_name text not null check (char_length(student_name) between 2 and 120),
  class text check (char_length(class) <= 40),
  institution text check (char_length(institution) <= 160),
  subjects text[] not null default '{}',
  mode text check (mode in ('online','offline')),
  preferred_time text check (char_length(preferred_time) <= 120),
  parent_phone text not null check (char_length(parent_phone) between 6 and 30),
  message text check (char_length(message) <= 2000),
  course_id uuid references public.courses (id) on delete set null,
  status text not null default 'new' check (status in ('new','contacted','enrolled','closed')),
  created_at timestamptz not null default now()
);
create index if not exists enrollments_created_idx on public.enrollments (created_at desc);
create index if not exists batches_course_idx on public.batches (course_id);
create index if not exists courses_subject_idx on public.courses (subject_id);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['site_settings','education','experience','specialties','subjects','courses','batches','trial_slots','testimonials','results','faqs']
  loop
    execute format('create trigger touch_%1$s before update on public.%1$I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ───────────────────────────── row level security ─────────────────────────────
-- Public reads published rows only; only the admin writes.
do $$
declare t text;
begin
  foreach t in array array['education','experience','specialties','subjects','courses','batches','trial_slots','testimonials','results','faqs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public reads published" on public.%I for select to anon, authenticated using (published or (select public.is_admin()))', t);
    execute format('create policy "admin inserts" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "admin updates" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "admin deletes" on public.%I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;

alter table public.site_settings enable row level security;
create policy "public reads settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admin updates settings" on public.site_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Enrollments: anyone may submit, nobody but the admin may read.
alter table public.enrollments enable row level security;
create policy "public submits enrollment" on public.enrollments for insert to anon, authenticated
  with check (status = 'new');
create policy "admin reads enrollments" on public.enrollments for select to authenticated using ((select public.is_admin()));
create policy "admin updates enrollments" on public.enrollments for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin deletes enrollments" on public.enrollments for delete to authenticated using ((select public.is_admin()));

-- ───────────────────────────── storage ─────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

create policy "admin uploads media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));
create policy "admin updates media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
create policy "admin deletes media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
