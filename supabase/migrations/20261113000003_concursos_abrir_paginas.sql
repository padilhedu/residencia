-- Radar de concursos: as listagens dos sites mostram só o órgão; o cargo (dentista) está na página de cada concurso.
-- Novo tipo de fonte 'lista': lê a listagem, abre cada concurso cujo link casa com `padrao` e procura o cargo lá dentro.
-- Resultado da 1ª varredura (13/11/2026): PCI Concursos recusa conexões de servidores; Atlas Público bloqueia com
-- Cloudflare; Folha Dirigida e a página da Ebserh deram 404; as "buscas" do Concursos no Brasil devolvem as últimas
-- notícias do site (não filtram) — todas desligadas.

alter table public.concurso_fontes drop constraint concurso_fontes_tipo_check;
alter table public.concurso_fontes add constraint concurso_fontes_tipo_check check (tipo in ('pci','rss','links','lista'));
alter table public.concurso_fontes add column padrao text;  -- regex do caminho dos links de cada concurso

update public.concurso_fontes set ativo = false
where tipo = 'pci'
   or url in (
     'https://folha.qconcursos.com/concursos/cargos/dentista',
     'https://atlaspublico.com.br/concursos/sc',
     'https://www.gov.br/ebserh/pt-br/ensino-e-pesquisa/enare',
     'https://concursosnobrasil.com/search/dentista/feed/rss2/',
     'https://concursosnobrasil.com/search/resid%C3%AAncia/feed/rss2/',
     'https://concursosnobrasil.com/search/enare/feed/rss2/'
   );

update public.concurso_fontes set tipo = 'lista', padrao = '^/concurso/[a-z0-9-]+-[0-9]+/?$', dica = null
where url = 'https://jcconcursos.com.br/concursos/sc';
update public.concurso_fontes set tipo = 'lista', padrao = '^/concursos-santa-catarina/[a-z0-9-]+-[0-9]+/?$', dica = null
where url = 'https://www.acheconcursos.com.br/concursos-santa-catarina';
update public.concurso_fontes set tipo = 'lista', padrao = '^/concursos/sc/', dica = null
where url = 'https://concursosnobrasil.com/concursos/sc/feed/';

insert into public.concurso_fontes (nome, tipo, url, padrao, uf) values
  ('JC Concursos — nacionais (ENARE, Ebserh, residências)', 'lista', 'https://jcconcursos.com.br/concursos/nacional', '^/concurso/[a-z0-9-]+-[0-9]+/?$', null),
  ('Ache Concursos — abertos no Brasil (residências)', 'lista', 'https://www.acheconcursos.com.br/concursos-abertos', '^/concursos-[a-z-]+/[a-z0-9-]+-[0-9]+/?$', null)
on conflict (url) do nothing;

-- Remove o que a 1ª varredura trouxe das "buscas" que não filtravam (notícias sem relação com Odontologia)
delete from public.concursos where fonte like 'Concursos no Brasil — busca%';
