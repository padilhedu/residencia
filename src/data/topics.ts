import type { Topic } from '../lib/types'

// Bibliografia oficial: Anexo I — Referências Bibliográficas, Residência Multiprofissional FDT 2026 (Fundatec).
// Os links abaixo foram copiados do edital. Buscas de vídeo apontam para o YouTube (resultados sempre atualizados).

const L = {
  cf: { t: 'CF/88 — arts. 196 a 200 (Saúde)', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
  l8080: { t: 'Lei 8.080/1990 — Lei Orgânica da Saúde', url: 'http://www.planalto.gov.br/ccivil_03/leis/L8080.htm' },
  l8142: { t: 'Lei 8.142/1990 — participação da comunidade e financiamento', url: 'http://www.planalto.gov.br/ccivil_03/leis/l8142.htm' },
  d7508: { t: 'Decreto 7.508/2011 — regulamenta a Lei 8.080', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/decreto/d7508.htm' },
  lc141: { t: 'Lei Complementar 141/2012 — mínimos em saúde', url: 'http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp141.htm' },
  l15126: { t: 'Lei 15.126/2025 — atenção humanizada como princípio do SUS', url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15126.htm' },
  d12560: { t: 'Decreto 12.560/2025 — Rede Nacional de Dados em Saúde e SUS Digital', url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/D12560.htm' },
  d7053: { t: 'Decreto 7.053/2009 — Política Nacional para a População em Situação de Rua', url: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/decreto/d7053.htm' },
  l14821: { t: 'Lei 14.821/2024 — PNTC PopRua', url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14821.htm' },
  pnab: { t: 'Portaria 2.436/2017 — PNAB', url: 'https://www.in.gov.br/materia/-/asset_publisher/Kujrw0TZC2Mb/content/id/19308123/do1-2017-09-22-portaria-n-2-436-de-21-de-setembro-de-2017-19308031' },
  emulti: { t: 'Portaria GM/MS 635/2023 — eMulti', url: 'https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-635-de-22-de-maio-de-2023-484773799' },
  pc1: { t: 'Portaria de Consolidação nº 1/2017 — Título I: direitos e deveres dos usuários', url: 'https://digisusgmp.saude.gov.br/v1.5/biblioteca/Portaria-de-Consolida%C3%A7%C3%A3o-1-2017' },
  p12022: { t: 'Portaria GM/MS 12.022/2026 — Planejamento do SUS', url: 'https://www.conass.org.br/conass-informa-n-143-2026-publicada-a-portaria-gm-n-12-022-que-altera-a-portaria-de-consolidacao-no-1-de-28-de-setembro-de-2017-para-dispor-sobre-o-planejamento-do-sus/' },
  pnsp2026: { t: 'Portaria GM/MS 11.527/2026 — Política Nacional de Qualidade e Segurança do Paciente', url: 'https://www.in.gov.br/web/dou/-/portaria-gm/ms-n-11.527-de-9-de-junho-de-2026-711400715' },
  p230: { t: 'Portaria GM/MS 230/2023 — Equidade de Gênero, Raça e Valorização das Trabalhadoras', url: 'https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-230-de-7-de-marco-de-2023-468487936' },
  p1526: { t: 'Portaria GM/MS 1.526/2023 — PNAISPD e Rede de Cuidados à Pessoa com Deficiência', url: 'https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-1.526-de-11-de-outubro-de-2023-516446366' },
  pnrs: { t: 'Portaria Interministerial 8.995/2025 — Política Nacional de Residências em Saúde', url: 'https://www.in.gov.br/web/dou/-/portaria-interministerial-ms/mec-n-8.995-de-28-de-novembro-de-2025-672007632' },
  adapta: { t: 'Plano Setorial de Saúde — AdaptaSUS (2025)', url: 'https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/vigilancia-ambiental/plano-setorial-de-saude-adaptasus.pdf' },
  pnps: { t: 'Política Nacional de Promoção da Saúde (PNPS)', url: 'https://docs.bvsalud.org/biblioref/2023/05/1428106/politica_nacional_promocao_saude.pdf' },
  pneps: { t: 'Política Nacional de Educação Permanente em Saúde (MS, 2009)', url: 'https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/educacao-e-pesquisa/qualificacao-profissional-em-vigilancia-sanitaria/politica-nacional-de-educacao-permanente-em-saude.pdf' },
  pnhBase: { t: 'HumanizaSUS — Documento base para gestores e trabalhadores (2008)', url: 'https://redehumanizasus.net/acervo/humanizasus-documento-base-para-gestores-e-trabalhadores-do-sus-ministerio-da-saude-secretaria-de-atencao-a-saude-nucleo-tecnico-da-politica/' },
  pnhHosp: { t: 'Caderno HumanizaSUS v.3 — Atenção Hospitalar (cap. 1 a 4)', url: 'https://redehumanizasus.net/wp-content/uploads/2017/09/Cadernos-HumanizaSUS-Volume-3-Aten%C3%A7%C3%A3o-Hospitalar-1.pdf' },
  pnhAmb: { t: 'A experiência da diretriz de ambiência na PNH (2017)', url: 'http://redehumanizasus.net/lancamento-da-cartilha-humanizasus' },
  pnhFolheto: { t: 'Política Nacional de Humanização — folheto (2013)', url: 'https://bvsms.saude.gov.br/bvs/publicacoes/politica_nacional_humanizacao_pnh_folheto.pdf' },
  albuquerque: { t: 'Albuquerque (2015) — Uma revisão sobre as Políticas Públicas de Saúde no Brasil (UNA-SUS)', url: 'https://efivest.com.br/wp-content/uploads/2021/10/socie_polit_public_saud_2016.pdf' },
  paim2019: { t: 'Paim (2019) — Os sistemas universais de saúde e o futuro do SUS', url: 'https://www.scielo.br/j/sdeb/a/L9yVS4pjsxkShgZqk3z6Y4r/?format=pdf&lang=pt' },
  epi: { t: 'Carvalho, Pinho & Garcia (2017) — Epidemiologia: conceitos e aplicabilidade no SUS', url: 'https://ares.unasus.gov.br/acervo/items/e736ea2f-4468-4613-bb93-3f47bbb23295' },
  territ: { t: 'Flemming & Pereira (2019) — Territorialização na Atenção Básica', url: 'https://ares.unasus.gov.br/acervo/items/33dae5e8-5501-423e-815b-994973fcbc6b' },
  modelos: { t: 'Junior, Oliveira & Puttini (2010) — Modelos explicativos em Saúde Coletiva', url: 'https://www.scielo.br/j/physis/a/fGQr7m9LdpmHqh4fwmhCrpc/?lang=pt&format=pdf' },
  bioetica: { t: 'Junqueira (2012) — Bioética (UNA-SUS/UNIFESP)', url: 'https://ares.unasus.gov.br/acervo/items/22b8dade-4d88-4718-9494-9c56353ca767' },
  interseccional: { t: 'Macedo & Medeiros (2025) — Marcadores sociais da diferença e interseccionalidade', url: 'https://www.scielo.br/j/sdeb/a/HjCmwPDynQscSJ5DL5GMsYN/?format=html&lang=pt' },
  iaEtica: { t: 'Sampaio, Sabbatini & Limongi (2025) — Uso ético da IA generativa', url: 'https://econtents.sbu.unicamp.br/boletins/index.php/ppec/article/view/9509' },
  // Odontologia
  sbSus: { t: 'MS (2018) — A saúde bucal no Sistema Único de Saúde' },
  pnsb2004: { t: 'MS (2004) — Diretrizes da Política Nacional de Saúde Bucal (Brasil Sorridente)' },
  l14572: { t: 'Lei 14.572/2023 — Política Nacional de Saúde Bucal', url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14572.htm' },
  manualEsp: { t: 'MS (2008) — Manual de especialidades em saúde bucal (CEO)' },
  sb2023: { t: 'SB Brasil 2023 — relatório final (o link indicado no edital abre o relatório do SB Brasil 2010)', url: 'http://189.28.128.100/dab/docs/geral/projeto_sb2010_relatorio_final.pdf' },
  sbComp: { t: 'Carvalho & Atripoli (2025) — Comparação epidemiológica SB Brasil 2010 × 2023', url: 'https://www.researchgate.net/publication/394607308_Comparacao_Epidemiologica_em_Saude_Bucal_-_Brasil_2010_e_2023' },
  navegacao: { t: 'Portaria GM/MS 6.592/2025 — Navegação da pessoa com diagnóstico de câncer', url: 'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt6592_07_02_2025.html' },
  inca: { t: 'INCA (2022) — Diagnóstico precoce do câncer de boca', url: 'https://www.inca.gov.br/publicacoes/livros/diagnostico-precoce-do-cancer-de-boca' },
  fluor: { t: 'MS (2026) — Guia de recomendações para o uso de fluoretos no Brasil, 2ª ed.', url: 'http://bvsms.saude.gov.br/bvs/publicacoes/guia_recomendacoes_uso_fluoretos_Brasil_2ed.pdf' },
  icdas: { t: 'Braga et al. (2012) — O uso do ICDAS para diagnóstico e planejamento', url: 'https://edisciplinas.usp.br/pluginfile.php/4402882/mod_resource/content/2/Cariologia%20Leitura%20Complementar.pdf' },
  maltz: { t: 'Maltz et al. (2016) — Cariologia: conceitos básicos, diagnóstico e tratamento não restaurador' },
  baratieri: { t: 'Baratieri & Monteiro Jr. (2024) — Odontologia restauradora, 2 vols.' },
  firoozmand: { t: 'Firoozmand et al. (2021) — Odontologia minimamente invasiva: procedimentos em dentina', url: 'https://www.edufma.ufma.br/wp-content/uploads/woocommerce_uploads/2021/09/Ebook-OMIdentinaFINAL.pdf' },
  passos: { t: 'Passos, Ferreira & Mendonça (2022) — Guia prático de materiais dentários' },
  estrela: { t: 'Estrela & Bueno (2023) — Ciência Endodôntica, v.1', url: 'https://sumarios.odontomedi.com.br/Ciencia-Endodontica.pdf' },
  gaines: { t: 'Gaines et al. (2022) — Doenças pulpares e periapicais: revisão integrativa', url: 'https://www.conhecer.org.br/enciclop/2022c/doencas.pdf' },
  perioClass: { t: 'Steffens & Marcantonio (2018) — Classificação das doenças periodontais e peri-implantares 2018', url: 'https://www.scielo.br/j/rounesp/a/F9F6gnVnNm6hFt6MBrJ6dHC/?lang=pt&format=pdf' },
  perioMS: { t: 'MS (2025) — Diretriz para a prática clínica na APS: periodontite estágios I–III', url: 'https://bvsms.saude.gov.br/bvs/publicacoes/pratica_clinica_odontologica_aps_periodontite_v2.pdf' },
  lindhe: { t: 'Lindhe & Lang (2018) — Tratado de periodontia clínica e implantologia oral, 6ª ed.' },
  hupp: { t: 'Hupp, Ellis & Tucker (2015) — Cirurgia oral e maxilofacial contemporânea, 6ª ed.' },
  puricelli: { t: 'Puricelli et al. (2013) — Técnica anestésica, exodontia e cirurgia dentoalveolar' },
  puricelliAL: { t: 'Puricelli & Corsetti (2023) — Técnicas anestésicas locais em odontologia' },
  gil: { t: 'Gil & Gil (2012) — Cirurgia do terceiro molar impactado: passo a passo' },
  miloro: { t: 'Miloro et al. (2016) — Princípios de cirurgia bucomaxilofacial de Peterson' },
  ellis: { t: 'Ellis & Zide (2006) — Acessos cirúrgicos ao esqueleto facial' },
  fonseca: { t: 'Fonseca (2015) — Trauma bucomaxilofacial, 4ª ed.' },
  prado: { t: 'Prado & Salim (2018) — Cirurgia bucomaxilofacial: diagnóstico e tratamento' },
  recchioni: { t: 'Recchioni (2022) — Manual prático em cirurgia bucomaxilofacial' },
  wulkan: { t: 'Wulkan et al. (2005) — Epidemiologia do trauma facial', url: 'https://www.scielo.br/j/ramb/a/Ljf8HhW4YpqNSGftnkRH5sN/?lang=pt' },
  stevao: { t: 'Stevão (2014) — Cirurgia da articulação temporomandibular' },
  okeson: { t: 'Okeson (2008) — Tratamento das desordens temporomandibulares, 6ª ed.' },
  malamedAL: { t: 'Malamed (2021) — Manual de anestesia local, 7ª ed.' },
  malamedEm: { t: 'Malamed (2016) — Emergências médicas em odontologia' },
  cfoUrg: { t: 'CFO (2020) — O que são emergências e urgências odontológicas?', url: 'https://website.cfo.org.br/wp-content/uploads/2020/03/CFO-URGENCIAS-E-EMERGENCIAS.pdf' },
  wann: { t: 'Wannmacher & Rösing (2023) — Terapia medicamentosa em odontologia' },
  cab18: { t: 'MS (2022) — Atualização do CAB 18: HIV/Aids, hepatites virais, sífilis e outras IST' },
  souzaONM: { t: 'Souza & Batista (2022) — Osteonecrose relacionada ao bifosfonato' },
  vieiraOnco: { t: 'Vieira et al. (2012) — Tratamento odontológico em pacientes oncológicos (Oral Sci.)' },
  hospEduardo: { t: 'Eduardo, Bezinelli & Corrêa (2026) — Odontologia hospitalar, 2ª ed.' },
  hospSantos: { t: 'Santos & Soares Jr. (2022) — Medicina bucal: a prática na odontologia hospitalar', url: 'https://repositorio.usp.br/directbitstream/7c10d42c-2bf3-4bd1-957e-9f1c6a387b6e/3094097.pdf' },
  uti: { t: 'Taques et al. (2018) — Manual ilustrado para o cirurgião-dentista da UTI' },
  neville: { t: 'Neville et al. (2009) — Patologia oral e maxilofacial, 3ª ed.' },
  white: { t: 'White & Pharoah (2015) — Radiologia oral: princípios de interpretação, 7ª ed.' },
  radioUnasus: { t: 'Oliveira (2014) — Radiologia odontológica: princípios de interpretação (UNA-SUS/UFMA)', url: 'https://ares.unasus.gov.br/acervo/html/ARES/2620/1/Unidade_01_radiologia_odontologica.pdf' },
  ceo118: { t: 'Código de Ética Odontológica — Resolução CFO 118/2012 (consolidada)' },
  cfo196: { t: 'Resolução CFO 196/2019 — selfies e imagens de tratamentos', url: 'https://sistemas.cfo.org.br/visualizar/atos/RESOLU%C3%87%C3%83O/SEC/2019/196' },
  cfo198: { t: 'Resolução CFO 198/2019 — Harmonização Orofacial', url: 'https://sistemas.cfo.org.br/visualizar/atos/RESOLU%C3%87%C3%83O/SEC/2019/198' },
  cfo218: { t: 'Resolução CFO 218/2019 — Odontologia fora do consultório', url: 'https://sistemas.cfo.org.br/visualizar/atos/RESOLU%C3%87%C3%83O/SEC/2019/218' },
  cfo284: { t: 'Resolução CFO 284/2026 — área de atuação em cabeça e pescoço', url: 'https://sistemas.cfo.org.br/visualizar/atos/RESOLU%C3%87%C3%83O/SEC/2026/284/' },
  cfo286: { t: 'Resolução CFO 286/2026 — Cirurgia Estética Orofacial', url: 'https://www.in.gov.br/web/dou/-/resolucao-cfo-286-de-20-de-marco-de-2026-697080169' },
  cfo295: { t: 'Resolução CFO 295/2026 — sedação consciente', url: 'https://website.cfo.org.br/wp-content/uploads/2026/07/Resolucao-CFO-295-2026.pdf' },
  cfo296: { t: 'Resolução CFO 296/2026 — título de especialista via residência', url: 'https://sistemas.cfo.org.br/visualizar/atos/RESOLU%C3%87%C3%83O/SEC/2026/296/' },
  hmi: { t: 'Silva et al. (2020) — Tratamento da hipomineralização molar-incisivo (BJHR)' },
  rdc: { t: 'Anvisa — RDC 1002/2025 (boas práticas e processamento de dispositivos em serviços odontológicos)' },
  guiaVig1: { t: 'Guia de Vigilância em Saúde, v.1 (6ª ed. rev., 2024)', url: 'https://bvsms.saude.gov.br/bvs/publicacoes/guia_vigilancia_saude_6edrev_v1.pdf' },
  guiaVig2: { t: 'Guia de Vigilância em Saúde, v.2 (6ª ed. rev., 2024)', url: 'https://bvsms.saude.gov.br/bvs/publicacoes/guia_vigilancia_saude_v2_6edrev.pdf' }
}

export const TOPICS: Topic[] = [
  // ───────────────── Conhecimentos gerais: SUS ─────────────────
  {
    id: 'sus-leg', area: 'sus', name: 'Legislação do SUS', short: 'Legislação',
    items: [
      'CF/88 arts. 196–200: saúde como direito, relevância pública, diretrizes (descentralização, integralidade, participação), competências do SUS (art. 200)',
      'Lei 8.080/90: objetivos, princípios e diretrizes (art. 7º), competências por esfera (arts. 15–18), CIB/CIT, CONASS/CONASEMS (arts. 14-A/B), participação complementar privada, subsistemas',
      'Lei 8.142/90: Conselhos (deliberativos, paritários) e Conferências (4 em 4 anos), Fundo Nacional de Saúde e repasses',
      'Decreto 7.508/11: região de saúde, portas de entrada, RENASES, RENAME, COAP, mapa da saúde',
      'LC 141/12: mínimos (União, estados 12%, municípios 15%), o que é e o que não é ASPS',
      'Novidades: Lei 15.126/2025 (atenção humanizada como princípio) e Decreto 12.560/2025 (RNDS e SUS Digital)'
    ],
    refs: [L.cf, L.l8080, L.l8142, L.d7508, L.lc141, L.l15126, L.d12560],
    videos: ['Lei 8.080 comentada residência multiprofissional', 'Decreto 7.508 de 2011 explicado', 'Lei complementar 141 de 2012 saúde aula', 'Lei 8.142 conselhos e conferências de saúde aula'],
    tips: 'Fundatec troca uma palavra do texto legal ("formular" × "participar da formulação", "exclusivamente" × "preferencialmente", ano da lei). Leia a lei seca.'
  },
  {
    id: 'sus-hist', area: 'sus', name: 'História do SUS e Reforma Sanitária', short: 'História',
    items: [
      'Revolta da Vacina (1904), Lei Eloy Chaves/CAPs (1923), IAPs, Ministério da Saúde (1953), INPS/INAMPS',
      'Movimento sanitário (anos 1970), AIS e SUDS, 8ª Conferência Nacional de Saúde (1986)',
      'Seguridade social na CF/88; sistemas universais e futuro do SUS (Paim, 2019)'
    ],
    refs: [L.albuquerque, L.paim2019],
    videos: ['história das políticas de saúde no Brasil reforma sanitária aula', '8ª conferência nacional de saúde 1986 importância']
  },
  {
    id: 'sus-ras', area: 'sus', name: 'Redes de Atenção à Saúde e Regionalização', short: 'RAS',
    items: [
      'Conceito, elementos (população, estrutura operacional, modelo de atenção) e atributos das RAS',
      'Sistemas fragmentados × redes poliárquicas; relações horizontais; APS como centro de comunicação',
      'Fundamentos: economia de escala, qualidade, suficiência, acesso, disponibilidade de recursos',
      'Redes temáticas: Rede Alyne, RUE, RAPS, Rede de Cuidados à Pessoa com Deficiência, crônicas',
      'Portas de entrada e região de saúde (Decreto 7.508)'
    ],
    refs: [L.d7508, L.p1526, L.pnab],
    videos: ['redes de atenção à saúde Eugênio Vilaça Mendes aula', 'redes temáticas do SUS rede alyne RAPS RUE']
  },
  {
    id: 'sus-aps', area: 'sus', name: 'Atenção Primária, PNAB, ESF e eMulti', short: 'APS / PNAB',
    items: [
      'PNAB 2017: princípios e diretrizes, tipos de equipe (eSF, eAP, eSB, eCR), atribuições comuns e específicas (ACS, CD, TSB/ASB)',
      'Atributos da APS (Starfield): primeiro contato, longitudinalidade, integralidade, coordenação; derivados',
      'Territorialização: território-área, microárea, moradia; diagnóstico situacional; fontes de dados primárias × secundárias',
      'eMulti (Portaria 635/2023): modalidades Ampliada, Complementar e Estratégica; duplicidade profissional',
      'Financiamento da APS e acolhimento à demanda espontânea (classificação de risco)'
    ],
    refs: [L.pnab, L.emulti, L.territ],
    videos: ['PNAB 2017 portaria 2436 resumo concurso', 'eMulti portaria 635 2023 explicada', 'territorialização na atenção básica aula'],
    tips: 'Tema de maior incidência na FDT. Atenção a números (população/2.000 para teto de equipes; cargas horárias).'
  },
  {
    id: 'sus-pnh', area: 'sus', name: 'Política Nacional de Humanização, Acolhimento e Ambiência', short: 'PNH',
    items: [
      'Princípios: transversalidade, indissociabilidade atenção-gestão, protagonismo e corresponsabilidade',
      'Diretrizes: acolhimento, gestão participativa e cogestão, ambiência, clínica ampliada e compartilhada, valorização do trabalhador, defesa dos direitos dos usuários',
      'Dispositivos: acolhimento com classificação de risco, colegiados, PTS, visita aberta, ouvidoria',
      'Ambiência: confortabilidade, produção de subjetividades, espaço como ferramenta do trabalho',
      'Caderno HumanizaSUS — Atenção Hospitalar; acolhimento à demanda espontânea (CAB 28); coprodução (Campos)'
    ],
    refs: [L.pnhBase, L.pnhFolheto, L.pnhAmb, L.pnhHosp, L.l15126],
    videos: ['política nacional de humanização PNH aula completa', 'ambiência PNH cartilha', 'acolhimento com classificação de risco atenção básica']
  },
  {
    id: 'sus-pol', area: 'sus', name: 'Políticas de Saúde e Equidade', short: 'Políticas',
    items: [
      'PNPS: valores (felicidade, solidariedade, ética...), princípios (intersetorialidade, equidade...) e objetivos',
      'População em situação de rua: Decreto 7.053/2009 e Lei 14.821/2024 (PNTC PopRua); Consultório na Rua',
      'Saúde da população negra e racismo institucional; Programa de Equidade de Gênero e Raça (Portaria 230/2023)',
      'Pessoa com deficiência (Portaria 1.526/2023); telessaúde (Lei 14.510/2022); AdaptaSUS (clima e saúde)',
      'Interseccionalidade (Macedo & Medeiros, 2025); Política Nacional de Residências (2025); uso ético de IA generativa'
    ],
    refs: [L.pnps, L.d7053, L.l14821, L.p230, L.p1526, L.adapta, L.interseccional, L.pnrs, L.iaEtica],
    videos: ['política nacional de promoção da saúde PNPS aula', 'política nacional população em situação de rua decreto 7053', 'racismo institucional saúde população negra aula']
  },
  {
    id: 'sus-vig', area: 'sus', name: 'Vigilância, Epidemiologia e Indicadores', short: 'Vigilância',
    items: [
      'Política Nacional de Vigilância em Saúde (Res. CNS 588/2018): vigilâncias epidemiológica, sanitária, ambiental e do trabalhador',
      'Indicadores: mortalidade infantil, neonatal (precoce/tardia), pós-neonatal, perinatal; incidência × prevalência; indicadores socioeconômicos',
      'Dado × informação × sistema; sistemas de informação (SIM, SINASC, SINAN)',
      'Transição epidemiológica e doenças transmissíveis no Brasil (Barreto); notificação compulsória'
    ],
    refs: [L.epi, L.guiaVig1, L.guiaVig2],
    videos: ['indicadores de mortalidade infantil neonatal perinatal aula', 'política nacional de vigilância em saúde resolução 588', 'epidemiologia básica para concursos de saúde']
  },
  {
    id: 'sus-seg', area: 'sus', name: 'Segurança do Paciente e Saúde do Trabalhador', short: 'Segurança',
    items: [
      'PNSP e a nova Política Nacional de Qualidade e Segurança do Paciente (Portaria 11.527/2026)',
      'Metas/protocolos: identificação (≥ 2 identificadores), comunicação, medicamentos, cirurgia segura, higiene das mãos, quedas e lesões por pressão',
      'Cultura de segurança justa e não punitiva; notificação e análise de incidentes',
      'NR-32: perfurocortantes (vedado reencapar/desconectar), vacinação, EPI'
    ],
    refs: [L.pnsp2026],
    videos: ['programa nacional de segurança do paciente protocolos aula', 'NR 32 perfurocortantes resumo']
  },
  {
    id: 'sus-gestao', area: 'sus', name: 'Gestão, Planejamento, Financiamento e Controle Social', short: 'Gestão',
    items: [
      'Instrumentos de planejamento: Plano de Saúde, Programação Anual, RDQA, Relatório Anual de Gestão (Portaria 12.022/2026)',
      'Comissões intergestores (CIT, CIB, CIR), CONASS, CONASEMS, COSEMS; COAP',
      'Conselhos de saúde: deliberativos, permanentes, paridade 50/25/25',
      'Financiamento: LC 141, fundos de saúde, custeio da APS',
      'Planejamento em saúde (Paim); graus de excelência do cuidado (eficiência, efetividade, pontualidade...)'
    ],
    refs: [L.p12022, L.l8142, L.lc141],
    videos: ['instrumentos de planejamento do SUS plano de saúde RAG RDQA', 'controle social conselhos de saúde paridade aula']
  },
  {
    id: 'sus-eip', area: 'sus', name: 'Educação Permanente, Interprofissionalidade e Trabalho em Equipe', short: 'EPS / EIP',
    items: [
      'PNEPS: problematização do trabalho, planejamento ascendente, integração ensino-serviço, cogestão',
      'Educação permanente × continuada × capacitação',
      'Educação interprofissional (Costa 2017; Reeves): aprender com, para e sobre; competências comuns, específicas e colaborativas',
      'Práticas colaborativas; multi × inter × transdisciplinar; COAPES e Política Nacional de Residências'
    ],
    refs: [L.pneps, L.pnrs],
    videos: ['educação permanente em saúde PNEPS aula', 'educação interprofissional em saúde prática colaborativa']
  },
  {
    id: 'sus-etica', area: 'sus', name: 'Direitos dos Usuários, Bioética e Determinantes Sociais', short: 'Direitos / Bioética',
    items: [
      'Portaria de Consolidação 1/2017, Título I: direitos e deveres dos usuários; encaminhamento; informações visíveis no serviço',
      'Bioética: beneficência/não maleficência, autonomia (liberdade + informação), justiça/equidade; individualismo × utilitarismo',
      'Modelos explicativos do processo saúde-doença: biomédico, história natural, determinação social, biopsicossocial',
      'Determinantes sociais, interseccionalidade e marcadores sociais da diferença'
    ],
    refs: [L.pc1, L.bioetica, L.modelos, L.interseccional],
    videos: ['carta dos direitos dos usuários da saúde portaria de consolidação 1', 'princípios da bioética aula saúde', 'modelos explicativos processo saúde doença']
  },

  // ───────────────── Conhecimentos específicos: Odontologia ─────────────────
  {
    id: 'sb-col', area: 'odonto', name: 'Saúde Bucal Coletiva e PNSB (Brasil Sorridente)', short: 'Saúde bucal coletiva',
    items: [
      'Diretrizes da PNSB (2004) e Lei 14.572/2023: princípios, ações, linhas de cuidado, inclusão da saúde bucal na Lei 8.080',
      'Rede de Atenção à Saúde Bucal: eSB na APS, CEO (especialidades e critérios de encaminhamento), LRPD, atenção hospitalar',
      'SB Brasil 2010 × 2023: CPO-D aos 12 anos, edentulismo, necessidade de prótese, desigualdades regionais',
      'Matriciamento, urgência odontológica na APS, educação em saúde dialógica, planejamento e vigilância em saúde bucal',
      'Câncer de boca: diagnóstico precoce (INCA) e navegação do paciente oncológico (Portaria 6.592/2025)'
    ],
    refs: [L.l14572, L.pnsb2004, L.sbSus, L.manualEsp, L.sb2023, L.sbComp, L.inca, L.navegacao],
    videos: ['política nacional de saúde bucal lei 14572 2023', 'brasil sorridente CEO saúde bucal no SUS aula', 'SB Brasil 2023 resultados'],
    tips: 'Na FDT costuma vir dentro do bloco específico com texto de documento oficial; no ENARE aparece em casos clínicos (fluxo APS → CEO → hospital).'
  },
  {
    id: 'cario', area: 'odonto', name: 'Cariologia, Fluoretos e Dentística', short: 'Cariologia',
    items: [
      'Etiologia: biofilme, dieta (frequência de açúcares), Curva de Stephan; fatores determinantes × modificadores (Maltz)',
      'Diagnóstico: inspeção visual, ICDAS, sonda OMS; atividade de lesão; cárie radicular',
      'Guia de fluoretos (2ª ed., 2026): dentifrício 1.000–1.500 ppm, quantidade por idade, verniz, DFP 38%, água fluoretada, fluorose',
      'Tratamento não restaurador e remoção seletiva (Firoozmand); adesão, resinas, isolamento (Baratieri); materiais (Passos)',
      'Higiene bucal (Nyvad): escova, fio, dentifrícios e enxaguantes'
    ],
    refs: [L.maltz, L.icdas, L.fluor, L.firoozmand, L.baratieri, L.passos],
    videos: ['guia de recomendações para o uso de fluoretos no Brasil', 'ICDAS diagnóstico de cárie aula', 'remoção seletiva de tecido cariado mínima intervenção']
  },
  {
    id: 'endo', area: 'odonto', name: 'Endodontia', short: 'Endodontia',
    items: [
      'Diagnóstico pulpar e periapical: pulpite reversível × irreversível, necrose, lesões periapicais',
      'Preparo químico-mecânico: NaOCl, EDTA, instrumentação; medicação intracanal (hidróxido de cálcio)',
      'Imagem em endodontia: periapical × TCFC; reabsorções interna e externa'
    ],
    refs: [L.estrela, L.gaines],
    videos: ['diagnóstico pulpar e periapical aula endodontia', 'hidróxido de cálcio medicação intracanal']
  },
  {
    id: 'perio', area: 'odonto', name: 'Periodontia e Implantodontia', short: 'Periodontia',
    items: [
      'Classificação 2018: saúde, gengivite, periodontite (estágios I–IV, graus A–C), doenças necrosantes, abscessos',
      'Diretriz MS 2025: tratamento da periodontite estágios I–III na APS; critérios de encaminhamento ao CEO',
      'Antibióticos coadjuvantes (amoxicilina + metronidazol) — indicações restritas (EFP S3)',
      'Peri-implantite: diagnóstico e tratamento; fatores que afetam a osseointegração'
    ],
    refs: [L.perioClass, L.perioMS, L.lindhe],
    videos: ['classificação das doenças periodontais 2018 estágios e graus', 'peri-implantite diagnóstico e tratamento aula']
  },
  {
    id: 'trauma', area: 'odonto', name: 'Traumatismo Dentoalveolar', short: 'Trauma dental',
    items: [
      'IADT 2020: concussão, subluxação, luxações lateral, extrusiva e intrusiva; fraturas',
      'Avulsão: meios de armazenamento, reimplante, contenção, antibiótico (doxiciclina) e acompanhamento',
      'Tempo de contenção flexível (2 semanas; 4 semanas com fratura alveolar/intrusão)'
    ],
    refs: [L.estrela, L.hupp],
    videos: ['traumatismo dentário IADT 2020 luxações avulsão', 'avulsão dentária reimplante conduta']
  },
  {
    id: 'cir', area: 'odonto', name: 'Cirurgia Oral, Exodontia e Cicatrização', short: 'Cirurgia oral',
    items: [
      'Princípios: diérese, divulsão, exérese, hemostasia, síntese; retalhos (envelope, triangular, trapezoidal, semilunar)',
      'Instrumental: fórceps (numeração), alavancas (Seldin, apicais), lâminas de bisturi (11, 12, 15)',
      'Fios de sutura (absorvível × não, mono × multi), hemostáticos locais',
      'Terceiros molares: Pell & Gregory e Winter, dificuldade, indicações e complicações (alveolite, pericoronarite)',
      'Cirurgia paraendodôntica; contraindicações sistêmicas; cicatrização (1ª, 2ª e 3ª intenção)'
    ],
    refs: [L.hupp, L.puricelli, L.gil, L.miloro],
    videos: ['classificação de Pell e Gregory e Winter terceiro molar', 'instrumental cirúrgico odontologia fórceps alavancas', 'fios de sutura em odontologia classificação']
  },
  {
    id: 'ctbmf', area: 'odonto', name: 'Trauma de Face, Ortognática e Acessos', short: 'CTBMF',
    items: [
      'Atendimento ao politraumatizado (ATLS — avaliação primária × secundária); via aérea cirúrgica',
      'Fraturas: mandíbula (favorável/desfavorável, côndilo), zigoma, órbita (blow-out), NOE, Le Fort I/II/III',
      'Acessos cirúrgicos (Ellis & Zide): coronal, subciliar, subtarsal, transconjuntival, pré-auricular, retromandibular, Risdon',
      'Cirurgia ortognática: cefalometria (SNA, SNB), VSP, osteotomias; lesões nervosas (Seddon)',
      'Epidemiologia do trauma facial (Wulkan); bloqueio maxilomandibular (Ivy, Erich)'
    ],
    refs: [L.fonseca, L.ellis, L.prado, L.recchioni, L.miloro, L.wulkan],
    videos: ['fraturas de Le Fort classificação aula', 'acessos cirúrgicos ao esqueleto facial Ellis', 'fratura do complexo zigomático diagnóstico'],
    tips: 'Bloco de maior peso nas provas FDT de Odontologia (CTBMF + cirurgia ≈ 1/4 da prova específica).'
  },
  {
    id: 'infec', area: 'odonto', name: 'Infecções Odontogênicas', short: 'Infecções',
    items: [
      'Fases (inoculação, celulite, abscesso), microbiologia mista e endógena, gravidade',
      'Espaços fasciais: primários e secundários; faríngeo lateral, retrofaríngeo, submandibular; angina de Ludwig',
      'Complicações: fasceíte necrotizante, trombose do seio cavernoso, mediastinite; noma; actinomicose',
      'Antibioticoterapia (amoxicilina; clindamicina/azitromicina no alérgico) e drenagem'
    ],
    refs: [L.miloro, L.hupp, L.wann],
    videos: ['infecções odontogênicas espaços fasciais aula', 'angina de Ludwig conduta']
  },
  {
    id: 'anest', area: 'odonto', name: 'Anestesia Local', short: 'Anestesia',
    items: [
      'Mecanismo de ação, ésteres × amidas, metabolismo; composição do tubete (NaCl, bissulfito)',
      'Vasoconstritores (adrenalina, felipressina), concentração (1:100.000 = 10 µg/mL), doses máximas',
      'Técnicas: NAI, ASP, ASM, palatino maior, intraligamentar (PDL); falhas e complicações',
      'Toxicidade: sobredosagem de AL × de adrenalina; metemoglobinemia (prilocaína)'
    ],
    refs: [L.malamedAL, L.puricelliAL],
    videos: ['Malamed anestesia local farmacologia dos anestésicos', 'cálculo de dose máxima de anestésico local tubetes', 'técnicas anestésicas odontologia NAI']
  },
  {
    id: 'farmaco', area: 'odonto', name: 'Farmacologia e Terapêutica', short: 'Farmacologia',
    items: [
      'Farmacocinética: absorção, biodisponibilidade, distribuição, biotransformação; tolerância × dependência; idiossincrasia',
      'Analgésicos (dipirona, paracetamol), AINEs, opioides (codeína, tramadol); corticoides',
      'Antibióticos e profilaxia de endocardite (ESC 2023: amoxicilina/ampicilina 2 g; alternativas)',
      'Ansiolíticos (benzodiazepínicos), simpatomiméticos; ajustes em gestantes, crianças e sistêmicos (Wannmacher)'
    ],
    refs: [L.wann],
    videos: ['farmacologia em odontologia analgésicos antiinflamatórios', 'profilaxia antibiótica endocardite odontologia 2023']
  },
  {
    id: 'emerg', area: 'odonto', name: 'Emergências Médicas no Consultório', short: 'Emergências',
    items: [
      'Prevenção: anamnese, classificação ASA, sinais vitais (FC, FR, PA)',
      'Kit de emergência: adrenalina, anti-histamínico, broncodilatador, nitroglicerina, aspirina, benzodiazepínico/midazolam, glicose, O₂',
      'Síncope, hiperventilação, crise conversiva, convulsão, hipoglicemia, insuficiência adrenal',
      'Asma, anafilaxia, angina/IAM; sobredosagem de AL e de adrenalina; urgências × emergências (CFO 2020)'
    ],
    refs: [L.malamedEm, L.cfoUrg],
    videos: ['emergências médicas em odontologia Malamed aula', 'kit de emergência consultório odontológico medicamentos']
  },
  {
    id: 'especiais', area: 'odonto', name: 'Pacientes Especiais e Sistemicamente Comprometidos', short: 'Pac. especiais',
    items: [
      'Hipertensão (ESC 2024), cardiopatas, endocardite (ESC 2023), anticoagulados; diabetes',
      'Coagulopatias: doença de von Willebrand, hemofilias; cascata de coagulação',
      'Transplantados e imunossuprimidos (ciclosporina); pessoas vivendo com HIV (CAB 18)',
      'Osteonecrose associada a medicamentos (bisfosfonatos, denosumabe, antiangiogênicos): estadiamento, prevenção, protocolo PENTO',
      'Paciente oncológico antes/durante/após quimio e radioterapia'
    ],
    refs: [L.wann, L.cab18, L.souzaONM, L.vieiraOnco],
    videos: ['atendimento odontológico paciente hipertenso diabético', 'osteonecrose dos maxilares associada a medicamentos MRONJ', 'paciente com coagulopatia atendimento odontológico']
  },
  {
    id: 'hospitalar', area: 'odonto', name: 'Odontologia Hospitalar, UTI e Oncologia', short: 'Hospitalar',
    items: [
      'Atuação do CD na UTI: higiene oral, barreiras físicas e de comunicação, PAV',
      'Anestesia geral: ASA, Mallampati, jejum (2/6/8 h); sedação consciente (Resolução CFO 295/2026)',
      'Mucosite oral (fisiopatologia e manejo), osteorradionecrose, xerostomia pós-radioterapia',
      'Antissépticos (clorexidina, triclosan, peróxido) em imunossuprimidos'
    ],
    refs: [L.hospEduardo, L.hospSantos, L.uti, L.vieiraOnco, L.cfo295],
    videos: ['odontologia hospitalar UTI higiene bucal', 'mucosite oral fisiopatologia tratamento', 'osteorradionecrose prevenção']
  },
  {
    id: 'estomato', area: 'odonto', name: 'Estomatologia e Patologia de Mucosa', short: 'Estomatologia',
    items: [
      'Lesões potencialmente malignas (leucoplasia, eritroplasia, queilite actínica) e CEC: fatores de risco, sítios, TNM',
      'Infecções: candidíase, sífilis (primária/secundária/terciária), HIV (leucoplasia pilosa, Kaposi), histoplasmose, actinomicose',
      'Doenças imunomediadas: pênfigo vulgar e paraneoplásico, penfigoide, líquen plano, LES, eritema multiforme',
      'Lesões reacionais: granuloma piogênico, LPCG, fibroma ossificante periférico, hiperplasia fibrosa; biópsia (incisional × excisional)',
      'Tumores de tecidos moles (neurofibroma, schwannoma, neuroma, linfangioma); glândulas salivares; síndromes (Peutz-Jeghers)'
    ],
    refs: [L.neville, L.inca],
    videos: ['lesões potencialmente malignas leucoplasia eritroplasia aula', 'pênfigo vulgar penfigoide líquen plano diferenças', 'biópsia incisional e excisional indicações odontologia'],
    tips: 'Tema mais cobrado no ENARE (14% da prova de 2026), quase sempre em caso clínico.'
  },
  {
    id: 'pato', area: 'odonto', name: 'Cistos, Tumores Odontogênicos e Lesões Ósseas', short: 'Patologia óssea',
    items: [
      'Cistos inflamatórios (radicular, residual, paradentário/bifurcação vestibular) e de desenvolvimento (dentígero, CPL, COG, ceratocisto)',
      'Tumores odontogênicos: ameloblastoma, mixoma, TOA, odontoma',
      'Lesões fibro-ósseas (displasia fibrosa), lesão central de células gigantes',
      'Síndromes com repercussão craniofacial: Gorlin-Goltz, Apert, Crouzon, mucopolissacaridoses'
    ],
    refs: [L.neville, L.white],
    videos: ['cistos odontogênicos classificação aula', 'ameloblastoma diagnóstico e tratamento']
  },
  {
    id: 'radio', area: 'odonto', name: 'Radiologia e Imaginologia', short: 'Radiologia',
    items: [
      'Técnicas intraorais (paralelismo, bissetriz, Clark); panorâmica e erros/artefatos',
      'Radiografia digital × convencional',
      'Tomografia: coeficiente de atenuação, unidades Hounsfield, voxel, FOV; TCFC',
      'Interpretação: lesões periapicais, cistos (corticalização) × malignas, reabsorções'
    ],
    refs: [L.white, L.radioUnasus],
    videos: ['tomografia computadorizada de feixe cônico odontologia voxel FOV', 'técnica de Clark localização radiográfica']
  },
  {
    id: 'anato', area: 'odonto', name: 'Anatomia de Cabeça e Pescoço', short: 'Anatomia',
    items: [
      'Crânio: neurocrânio × viscerocrânio, ossos da órbita, forames (oval, redondo, canal óptico)',
      'Músculos da mastigação; supra-hióideos × infra-hióideos',
      'Artérias (carótida externa e ramos: lingual, facial, maxilar) e veias (retromandibular, plexo pterigoide)',
      'Nervos cranianos (trigêmeo, facial, oculomotores)'
    ],
    refs: [L.hupp, L.miloro],
    videos: ['anatomia de cabeça e pescoço odontologia músculos supra hioideos', 'nervo trigêmeo anatomia ramos aula']
  },
  {
    id: 'dtm', area: 'odonto', name: 'ATM, DTM e Dor Orofacial', short: 'ATM / DTM',
    items: [
      'Anatomia e inervação da ATM (auriculotemporal); disco articular',
      'DTM articular × muscular; deslocamento de disco com/sem redução; anquilose; luxação recidivante',
      'Cirurgia da ATM: artrocentese (Nitzan), discopexia, eminectomia, artroplastias (Puricelli)',
      'Síndrome de Frey; dor odontogênica × miofascial (Okeson)'
    ],
    refs: [L.okeson, L.stevao],
    videos: ['deslocamento de disco com e sem redução ATM aula', 'artrocentese da ATM técnica']
  },
  {
    id: 'biosseg', area: 'odonto', name: 'Biossegurança e Processamento', short: 'Biossegurança',
    items: [
      'RDC 1002/2025 (Anvisa): processamento de dispositivos médicos — pré-limpeza, limpeza, preparo, esterilização',
      'Classificação de Spaulding: críticos, semicríticos e não críticos',
      'Embalagens permitidas e proibidas; métodos de esterilização aceitos',
      'EPI: luvas (procedimento × estéreis), máscaras, responsabilidades do RT; NR-32'
    ],
    refs: [L.rdc],
    videos: ['biossegurança em odontologia processamento de artigos Anvisa', 'classificação de Spaulding críticos semicríticos']
  },
  {
    id: 'etica-odonto', area: 'odonto', name: 'Ética e Legislação Odontológica', short: 'Ética CFO',
    items: [
      'Código de Ética Odontológica: direitos (cap. II) e deveres (cap. III), prontuário, sigilo, consentimento, publicidade',
      'Resoluções CFO 196/2019 (selfies), 198/2019 (HOF), 218/2019 (estabelecimentos diversos)',
      'Resoluções CFO 2026: 284 (área de atuação em cabeça e pescoço), 286 (Cirurgia Estética Orofacial), 295 (sedação), 296 (especialista via residência)'
    ],
    refs: [L.ceo118, L.cfo196, L.cfo198, L.cfo218, L.cfo284, L.cfo286, L.cfo295, L.cfo296],
    videos: ['código de ética odontológica resolução 118 resumo', 'resoluções CFO 2026 novidades']
  },
  {
    id: 'geriatria', area: 'odonto', name: 'Odontogeriatria', short: 'Idoso',
    items: [
      'Hipossalivação/xerostomia: causas (medicamentos), consequências',
      'Cárie radicular, edentulismo, próteses e nutrição; qualidade de vida',
      'Cuidado integral e longitudinal do idoso no SUS; cuidador'
    ],
    refs: [L.sbSus, L.hospSantos],
    videos: ['odontogeriatria hipossalivação cárie radicular idoso']
  },
  {
    id: 'odontoped', area: 'odonto', name: 'Odontopediatria', short: 'Odontopediatria',
    items: [
      'Hipomineralização molar-incisivo (HMI): diagnóstico diferencial e tratamento',
      'Erupção dentária: sinais, sintomas e manejo (evitar anestésicos tópicos)',
      'Fluoretos na infância e fluorose'
    ],
    refs: [L.hmi, L.wann, L.fluor],
    videos: ['hipomineralização molar incisivo HMI tratamento', 'erupção dentária sintomas conduta odontopediatria']
  }
]

export const TOPIC_MAP = new Map(TOPICS.map((t) => [t.id, t]))

export const ytSearch = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`

export const topicName = (id: string) => TOPIC_MAP.get(id)?.name ?? id
export const topicShort = (id: string) => TOPIC_MAP.get(id)?.short ?? id
