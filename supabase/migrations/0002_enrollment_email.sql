-- Emails Shafin on every new enrollment by calling the notify-enrollment Edge Function.
-- The shared secret lives in Vault, not in this file. Store it once (same value as the
-- function's WEBHOOK_SECRET):
--   select vault.create_secret('<WEBHOOK_SECRET>', 'enrollment_webhook_secret');

create extension if not exists pg_net;

create or replace function public.notify_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
begin
  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'enrollment_webhook_secret'
  limit 1;

  if secret is null then
    raise warning 'notify_enrollment: vault secret enrollment_webhook_secret missing; no email sent';
    return new;
  end if;

  perform net.http_post(
    url := 'https://aiimjgswojvnigzrhsgv.supabase.co/functions/v1/notify-enrollment',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', secret),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

revoke execute on function public.notify_enrollment() from public, anon, authenticated;

drop trigger if exists enrollment_email on public.enrollments;
create trigger enrollment_email
after insert on public.enrollments
for each row execute function public.notify_enrollment();
