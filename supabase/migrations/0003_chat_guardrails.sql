-- Guardrails for the AI chat assistant (/api/chat).
-- 1. An on/off switch Shafin controls from /admin → Site text.
-- 2. Daily message counters per visitor, per IP and site-wide, kept here so the limit holds
--    across every server instance. Buckets are salted hashes; no IPs or messages are stored.
-- The shared secret lives in Vault, not in this file. Store it once (same value as the
-- CHAT_LIMITER_SECRET env var on the server):
--   select vault.create_secret('<CHAT_LIMITER_SECRET>', 'chat_limiter_secret');

alter table public.site_settings add column if not exists chat_enabled boolean not null default true;

create table if not exists public.chat_usage (
  bucket text not null,
  day date not null,
  count int not null default 0,
  primary key (bucket, day)
);

-- No policies: only chat_consume() touches this table.
alter table public.chat_usage enable row level security;

create or replace function public.chat_consume(
  p_secret text,
  p_user text,
  p_ip text,
  p_mode text default 'consume',
  p_user_limit int default 10,
  p_ip_limit int default 40,
  p_global_limit int default 500
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected text;
  d date := (now() at time zone 'Asia/Dhaka')::date;
  ub text := 'u:' || p_user;
  ib text := 'ip:' || p_ip;
  u int;
  i int;
  g int;
begin
  select decrypted_secret into expected from vault.decrypted_secrets where name = 'chat_limiter_secret' limit 1;
  if expected is null or p_secret is distinct from expected then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_mode = 'peek' then
    select coalesce(max(count), 0) into u from public.chat_usage where bucket = ub and day = d;
    return jsonb_build_object('allowed', u < p_user_limit, 'remaining', greatest(p_user_limit - u, 0));
  end if;

  if p_mode = 'refund' then
    update public.chat_usage set count = greatest(count - 1, 0) where day = d and bucket in (ub, ib, 'global');
    select coalesce(max(count), 0) into u from public.chat_usage where bucket = ub and day = d;
    return jsonb_build_object('allowed', true, 'remaining', greatest(p_user_limit - u, 0));
  end if;

  -- Increment first, then check, so concurrent requests can't slip past the limit.
  insert into public.chat_usage (bucket, day, count) values (ub, d, 1)
  on conflict (bucket, day) do update set count = public.chat_usage.count + 1
  returning count into u;
  if u > p_user_limit then
    update public.chat_usage set count = count - 1 where bucket = ub and day = d;
    return jsonb_build_object('allowed', false, 'reason', 'user', 'remaining', 0);
  end if;

  insert into public.chat_usage (bucket, day, count) values (ib, d, 1)
  on conflict (bucket, day) do update set count = public.chat_usage.count + 1
  returning count into i;
  if i > p_ip_limit then
    update public.chat_usage set count = count - 1 where day = d and bucket in (ub, ib);
    return jsonb_build_object('allowed', false, 'reason', 'ip', 'remaining', greatest(p_user_limit - u + 1, 0));
  end if;

  insert into public.chat_usage (bucket, day, count) values ('global', d, 1)
  on conflict (bucket, day) do update set count = public.chat_usage.count + 1
  returning count into g;
  if g > p_global_limit then
    update public.chat_usage set count = count - 1 where day = d and bucket in (ub, ib, 'global');
    return jsonb_build_object('allowed', false, 'reason', 'global', 'remaining', greatest(p_user_limit - u + 1, 0));
  end if;

  -- Occasional housekeeping: keep a week of counters.
  if random() < 0.02 then
    delete from public.chat_usage where day < d - 7;
  end if;

  return jsonb_build_object('allowed', true, 'remaining', p_user_limit - u);
end;
$$;

-- Callable with the publishable key, but useless without the Vault secret.
revoke execute on function public.chat_consume(text, text, text, text, int, int, int) from public;
grant execute on function public.chat_consume(text, text, text, text, int, int, int) to anon, authenticated;
