-- Tentativas de resposta (log append-only; o estado da revisão espaçada é recalculado a partir dele)
create table public.attempts (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id text not null,
  selected text not null,
  correct boolean not null,
  guessed boolean not null default false,
  mode text not null default 'treino' check (mode in ('treino','simulado','revisao')),
  time_ms integer,
  created_at timestamptz not null default now()
);
create index attempts_user_created_idx on public.attempts (user_id, created_at);
create index attempts_user_question_idx on public.attempts (user_id, question_id);

-- Estado chave-valor do usuário: favoritos, anotações, correções de gabarito, checklist do cronograma, ajustes
create table public.user_state (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('star','note','override','plan','settings','topic')),
  key text not null,
  value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, key)
);
create index user_state_user_updated_idx on public.user_state (user_id, updated_at);

alter table public.attempts enable row level security;
alter table public.user_state enable row level security;

create policy "attempts_select_own" on public.attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy "attempts_insert_own" on public.attempts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "attempts_delete_own" on public.attempts for delete to authenticated using ((select auth.uid()) = user_id);

create policy "state_select_own" on public.user_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "state_insert_own" on public.user_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "state_update_own" on public.user_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "state_delete_own" on public.user_state for delete to authenticated using ((select auth.uid()) = user_id);

-- Visão de desempenho por questão (útil para consultas no painel do Supabase)
create view public.question_stats with (security_invoker = true) as
select user_id, question_id,
       count(*) as total,
       count(*) filter (where correct and not guessed) as acertos,
       max(created_at) as ultima
from public.attempts
group by user_id, question_id;
