-- Radar de concursos: busca só em sites de concursos, semanal, com aviso ligado por padrão

-- Fonte que só lista vagas de dentista (página do cargo) e UF fixa de fontes estaduais
alter table public.concurso_fontes add column so_dentista boolean not null default false;
alter table public.concurso_fontes add column uf text;

-- Sai o Google Notícias (fica registrado, desligado); entram sites de concursos
update public.concurso_fontes set ativo = false where tipo = 'rss' and url like 'https://news.google.com/%';
update public.concurso_fontes set so_dentista = true where url in (
  'https://www.pciconcursos.com.br/cargos/dentista',
  'https://www.pciconcursos.com.br/cargos/cirurgiao-dentista',
  'https://www.pciconcursos.com.br/cargos/odontologo'
);
update public.concurso_fontes set uf = 'SC' where url = 'https://www.pciconcursos.com.br/concursos/sc/';

insert into public.concurso_fontes (nome, tipo, url, dica, so_dentista, uf) values
  ('PCI Concursos — cargo Odontólogo Clínico', 'pci', 'https://www.pciconcursos.com.br/cargos/odontologo-clinico', null, true, null),
  ('Concursos no Brasil — SC', 'rss', 'https://concursosnobrasil.com/concursos/sc/feed/', null, false, 'SC'),
  ('Concursos no Brasil — busca dentista', 'rss', 'https://concursosnobrasil.com/search/dentista/feed/rss2/', null, false, null),
  ('Concursos no Brasil — busca residência', 'rss', 'https://concursosnobrasil.com/search/resid%C3%AAncia/feed/rss2/', 'residencia', false, null),
  ('Concursos no Brasil — busca ENARE', 'rss', 'https://concursosnobrasil.com/search/enare/feed/rss2/', 'enare', false, null),
  ('JC Concursos — SC', 'links', 'https://jcconcursos.com.br/concursos/sc', null, false, 'SC'),
  ('Ache Concursos — SC', 'links', 'https://www.acheconcursos.com.br/concursos-santa-catarina', null, false, 'SC'),
  ('Atlas Público — SC', 'links', 'https://atlaspublico.com.br/concursos/sc', null, false, 'SC'),
  ('Folha Dirigida — dentista', 'links', 'https://folha.qconcursos.com/concursos/cargos/dentista', null, false, null),
  ('SES/SC — concursos e seleções', 'links', 'https://www.saude.sc.gov.br/index.php/pt/servicos/concursos-e-selecoes', null, false, 'SC')
on conflict (url) do nothing;

-- Toda segunda-feira às 07:23 (Brasília)
select cron.unschedule('buscar-concursos');
select cron.schedule(
  'buscar-concursos',
  '23 10 * * 1',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/buscar-concursos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- Aviso ligado por padrão: todo aparelho com notificações ativadas recebe o resumo semanal,
-- a menos que o usuário tenha desligado ({ "on": false }) na aba Concursos.
drop function public.concurso_alert_users();
create function public.concurso_alert_users()
returns table (user_id uuid, categorias jsonb)
language sql
security definer
set search_path = ''
as $$
  select distinct p.user_id, s.value -> 'categorias'
  from public.push_subscriptions p
  left join public.user_state s on s.user_id = p.user_id and s.kind = 'alert' and s.key = 'concursos'
  where coalesce((s.value ->> 'on')::boolean, true);
$$;
revoke all on function public.concurso_alert_users() from public, anon, authenticated;
grant execute on function public.concurso_alert_users() to service_role;
