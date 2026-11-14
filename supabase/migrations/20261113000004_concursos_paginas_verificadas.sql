-- Radar de concursos: a Ache Concursos responde 429 (muitas requisições) depois de ~5 páginas seguidas.
-- 1) Páginas de concurso já verificadas ficam registradas: nas semanas seguintes só os concursos novos são abertos.
-- 2) Cada fonte define quantas páginas abre ao mesmo tempo e a pausa entre elas.
create table public.concurso_paginas (
  id text primary key,  -- hash da URL canônica da página do concurso
  fonte_id bigint references public.concurso_fontes(id) on delete cascade,
  aberto_em timestamptz not null default now()
);
alter table public.concurso_paginas enable row level security;  -- só o service_role usa

alter table public.concurso_fontes add column paralelo int not null default 4 check (paralelo between 1 and 8);
alter table public.concurso_fontes add column pausa_ms int not null default 0 check (pausa_ms between 0 and 10000);

update public.concurso_fontes set paralelo = 1, pausa_ms = 2500 where url like 'https://www.acheconcursos.com.br/%';
