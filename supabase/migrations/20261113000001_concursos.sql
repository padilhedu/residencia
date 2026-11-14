-- Radar de concursos e residências para cirurgiões-dentistas
-- (concursos em SC, ENARE e residências em Odontologia no Brasil).
-- A Edge Function buscar-concursos varre as fontes 2x por dia e grava aqui; o app só lê.

create table public.concursos (
  id text primary key,                         -- hash da URL canônica
  categoria text not null check (categoria in ('sc','enare','residencia')),
  titulo text not null,
  orgao text,
  uf text,
  url text not null,
  fonte text not null,
  resumo text,
  vagas text,
  salario text,
  inscricoes_ate date,
  publicado_em timestamptz,
  primeiro_visto timestamptz not null default now(),
  visto_em timestamptz not null default now(),  -- última vez que alguma fonte ainda listava
  oculto boolean not null default false         -- para esconder um falso positivo pelo painel
);
create index concursos_categoria_idx on public.concursos (categoria, primeiro_visto desc);

-- Fontes varridas (dá para corrigir/incluir URLs pelo painel do Supabase sem novo deploy)
create table public.concurso_fontes (
  id bigint generated always as identity primary key,
  nome text not null,
  tipo text not null check (tipo in ('pci','rss','links')),
  url text not null unique,
  dica text check (dica in ('sc','enare','residencia')),  -- fonte dedicada a uma categoria
  ativo boolean not null default true,
  ultimo_status text,
  ultimo_total int,
  atualizado_em timestamptz
);

create table public.concurso_execucoes (
  id bigint generated always as identity primary key,
  iniciado_em timestamptz not null default now(),
  origem text not null,                      -- 'cron' ou 'app'
  encontrados int,
  novos int,
  erros jsonb
);

alter table public.concursos enable row level security;
alter table public.concurso_fontes enable row level security;
alter table public.concurso_execucoes enable row level security;
-- Leitura pública (são editais públicos); escrita só pelo service_role (Edge Function)
create policy "concursos_leitura" on public.concursos for select to anon, authenticated using (not oculto);
create policy "fontes_leitura" on public.concurso_fontes for select to anon, authenticated using (true);
create policy "execucoes_leitura" on public.concurso_execucoes for select to anon, authenticated using (true);

-- Estado por usuário: acompanhamento de cada concurso (favorito/inscrito/oculto) e alerta de novos editais
alter table public.user_state drop constraint user_state_kind_check;
alter table public.user_state add constraint user_state_kind_check
  check (kind in ('star','note','override','plan','settings','topic','errtype','card','official','forecast','concurso','alert'));

-- Para notificar só quem pediu alerta de novos concursos (só o service_role)
create or replace function public.concurso_alert_users()
returns table (user_id uuid, categorias jsonb)
language sql
security definer
set search_path = ''
as $$
  select s.user_id, s.value -> 'categorias'
  from public.user_state s
  where s.kind = 'alert' and s.key = 'concursos' and coalesce((s.value ->> 'on')::boolean, false);
$$;
revoke all on function public.concurso_alert_users() from public, anon, authenticated;
grant execute on function public.concurso_alert_users() to service_role;

insert into public.concurso_fontes (nome, tipo, url, dica) values
  ('PCI Concursos — SC', 'pci', 'https://www.pciconcursos.com.br/concursos/sc/', null),
  ('PCI Concursos — Sul', 'pci', 'https://www.pciconcursos.com.br/concursos/sul/', null),
  ('PCI Concursos — cargo Dentista', 'pci', 'https://www.pciconcursos.com.br/cargos/dentista', null),
  ('PCI Concursos — cargo Cirurgião Dentista', 'pci', 'https://www.pciconcursos.com.br/cargos/cirurgiao-dentista', null),
  ('PCI Concursos — cargo Odontólogo', 'pci', 'https://www.pciconcursos.com.br/cargos/odontologo', null),
  ('PCI Concursos — Residência', 'pci', 'https://www.pciconcursos.com.br/cargos/residente', 'residencia'),
  ('Google Notícias — dentista SC', 'rss', 'https://news.google.com/rss/search?q=concurso+(dentista+OR+%22cirurgi%C3%A3o-dentista%22+OR+odont%C3%B3logo)+(SC+OR+%22Santa+Catarina%22)+when:30d&hl=pt-BR&gl=BR&ceid=BR:pt-419', null),
  ('Google Notícias — processo seletivo dentista SC', 'rss', 'https://news.google.com/rss/search?q=%22processo+seletivo%22+dentista+(SC+OR+%22Santa+Catarina%22)+when:30d&hl=pt-BR&gl=BR&ceid=BR:pt-419', null),
  ('Google Notícias — ENARE', 'rss', 'https://news.google.com/rss/search?q=ENARE+(edital+OR+inscri%C3%A7%C3%B5es+OR+resid%C3%AAncia)+when:60d&hl=pt-BR&gl=BR&ceid=BR:pt-419', 'enare'),
  ('Google Notícias — residência Odontologia', 'rss', 'https://news.google.com/rss/search?q=resid%C3%AAncia+(odontologia+OR+bucomaxilofacial+OR+%22sa%C3%BAde+bucal%22)+(edital+OR+inscri%C3%A7%C3%B5es)+when:60d&hl=pt-BR&gl=BR&ceid=BR:pt-419', 'residencia'),
  ('Google Notícias — residência multiprofissional', 'rss', 'https://news.google.com/rss/search?q=%22resid%C3%AAncia+multiprofissional%22+(edital+OR+inscri%C3%A7%C3%B5es)+when:45d&hl=pt-BR&gl=BR&ceid=BR:pt-419', 'residencia'),
  ('Ebserh — ENARE (página oficial)', 'links', 'https://www.gov.br/ebserh/pt-br/ensino-e-pesquisa/enare', 'enare');

-- Varredura 2x por dia (07:23 e 18:23 em Brasília)
select cron.schedule(
  'buscar-concursos',
  '23 10,21 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/buscar-concursos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
