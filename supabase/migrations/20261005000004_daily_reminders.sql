-- Lembrete diário de revisão por Web Push
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Aparelhos inscritos (um por navegador/celular) e a hora local escolhida para o aviso
create table public.push_subscriptions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  hour smallint not null default 19 check (hour between 0 and 23),
  tz text not null default 'America/Sao_Paulo',
  last_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;
create policy "push_select_own" on public.push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy "push_insert_own" on public.push_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "push_update_own" on public.push_subscriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "push_delete_own" on public.push_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);

-- Configuração lida pela Edge Function (segredos ficam no Vault; só o service_role executa)
-- Segredos esperados no Vault: vapid_public, vapid_private, vapid_subject, reminder_cron_secret, project_url
create or replace function public.reminder_config()
returns table (vapid_public text, vapid_private text, vapid_subject text, cron_secret text)
language sql
security definer
set search_path = ''
as $$
  select
    (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_public'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_private'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_subject'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret');
$$;
revoke all on function public.reminder_config() from public, anon, authenticated;
grant execute on function public.reminder_config() to service_role;

-- De hora em hora: a função decide quem está na hora local escolhida
select cron.schedule(
  'daily-review-reminders',
  '0 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);
