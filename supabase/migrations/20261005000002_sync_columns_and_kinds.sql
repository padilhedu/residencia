-- Momento em que a linha chegou ao servidor (permite sincronização incremental entre aparelhos)
alter table public.attempts add column inserted_at timestamptz not null default now();
create index attempts_user_inserted_idx on public.attempts (user_id, inserted_at);

-- Novos tipos de estado: tipo de erro (conteúdo/interpretação/desatenção)
alter table public.user_state drop constraint user_state_kind_check;
alter table public.user_state add constraint user_state_kind_check
  check (kind in ('star','note','override','plan','settings','topic','errtype'));
