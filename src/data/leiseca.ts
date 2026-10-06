import type { Flashcard } from '../lib/flash'

/**
 * Baralho de lei seca: dispositivos mais cobrados pela Fundatec e pela FGV.
 * O verso traz o texto da norma (com as palavras que a banca costuma trocar em negrito).
 * Confira sempre a redação vigente no link oficial de cada cartão.
 */

const U = {
  cf: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
  l8080: 'http://www.planalto.gov.br/ccivil_03/leis/L8080.htm',
  l8142: 'http://www.planalto.gov.br/ccivil_03/leis/l8142.htm',
  d7508: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/decreto/d7508.htm',
  lc141: 'http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp141.htm',
  pnab: 'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prt2436_22_09_2017.html',
  l14572: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14572.htm',
  l5081: 'https://www.planalto.gov.br/ccivil_03/leis/l5081.htm',
  l11889: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11889.htm'
}

/** url do cartão: omitida = a da norma do grupo; null = sem link */
type Raw = [id: string, src: string, f: string, b: string, url?: string | null]

const groups: { group: string; topic: string; url: string; cards: Raw[] }[] = [
  {
    group: 'CF/88', topic: 'sus-leg', url: U.cf,
    cards: [
      ['cf196', 'CF/88, art. 196', 'Art. 196 da CF: a saúde é direito de todos e dever de quem? Garantida mediante o quê?',
        'A saúde é direito de todos e <b>dever do Estado</b>, garantido mediante <b>políticas sociais e econômicas</b> que visem à <b>redução do risco</b> de doença e de outros agravos e ao <b>acesso universal e igualitário</b> às ações e serviços para sua <b>promoção, proteção e recuperação</b>.'],
      ['cf197', 'CF/88, art. 197', 'Como a CF qualifica as ações e serviços de saúde (art. 197) e quem pode executá-los?',
        'São de <b>relevância pública</b> as ações e serviços de saúde, cabendo ao Poder Público dispor, nos termos da lei, sobre sua <b>regulamentação, fiscalização e controle</b>, devendo sua execução ser feita <b>diretamente ou através de terceiros</b> e, também, por pessoa física ou jurídica de direito privado.'],
      ['cf198', 'CF/88, art. 198, I a III', 'Quais são as 3 diretrizes do SUS na CF (art. 198)?',
        'Rede <b>regionalizada e hierarquizada</b>, sistema único, com as diretrizes:<br>I – <b>descentralização</b>, com direção única em cada esfera de governo;<br>II – <b>atendimento integral</b>, com <b>prioridade para as atividades preventivas</b>, sem prejuízo dos serviços assistenciais;<br>III – <b>participação da comunidade</b>.'],
      ['cf198p1', 'CF/88, art. 198, §1º', 'Como o SUS é financiado segundo a CF (art. 198, §1º)?',
        'Nos termos do art. 195, com recursos do <b>orçamento da seguridade social</b>, da União, dos Estados, do DF e dos Municípios, <b>além de outras fontes</b>.'],
      ['cf198p2', 'CF/88, art. 198, §2º; LC 141/2012', 'Mínimos de aplicação em ações e serviços públicos de saúde: União, Estados e Municípios.',
        '<b>União</b>: 15% da <b>receita corrente líquida</b> (art. 198, §2º, I, redação da EC 86/2015).<br><b>Estados e DF</b>: <b>12%</b> da arrecadação de impostos e transferências.<br><b>Municípios e DF</b>: <b>15%</b> (LC 141/2012, arts. 6º e 7º).'],
      ['cf198p4', 'CF/88, art. 198, §4º', 'Como os gestores locais podem admitir ACS e ACE (CF, art. 198, §4º)?',
        'Por meio de <b>processo seletivo público</b>, de acordo com a natureza e complexidade de suas atribuições e requisitos específicos para sua atuação (EC 51/2006).'],
      ['cf199', 'CF/88, art. 199, caput e §1º', 'Como a iniciativa privada participa do SUS (CF, art. 199)?',
        'A assistência à saúde é <b>livre à iniciativa privada</b>. As instituições privadas poderão participar de forma <b>complementar</b> do SUS, segundo diretrizes deste, mediante <b>contrato de direito público ou convênio</b>, tendo <b>preferência as entidades filantrópicas e as sem fins lucrativos</b>.'],
      ['cf199p2', 'CF/88, art. 199, §§2º e 3º', 'O que a CF veda quanto a recursos públicos e capital estrangeiro na saúde?',
        '§2º É <b>vedada</b> a destinação de recursos públicos para <b>auxílios ou subvenções</b> às instituições privadas <b>com fins lucrativos</b>.<br>§3º É vedada a participação direta ou indireta de <b>empresas ou capitais estrangeiros</b> na assistência à saúde no País, <b>salvo nos casos previstos em lei</b>.'],
      ['cf199p4', 'CF/88, art. 199, §4º', 'O que a CF diz sobre órgãos, tecidos, sangue e hemoderivados?',
        'A lei disporá sobre condições e requisitos para a remoção de órgãos, tecidos e substâncias humanas para transplante, pesquisa e tratamento, bem como a coleta, processamento e transfusão de sangue e derivados, sendo <b>vedado todo tipo de comercialização</b>.'],
      ['cf200a', 'CF/88, art. 200, I a IV', 'Art. 200 da CF: competências do SUS (incisos I a IV). Atenção aos verbos.',
        'I – <b>controlar e fiscalizar</b> procedimentos, produtos e substâncias de interesse para a saúde e <b>participar da produção</b> de medicamentos, equipamentos, imunobiológicos, hemoderivados e outros insumos;<br>II – <b>executar</b> as ações de vigilância sanitária e epidemiológica, bem como as de saúde do trabalhador;<br>III – <b>ordenar</b> a formação de recursos humanos na área de saúde;<br>IV – <b>participar</b> da formulação da política e da execução das ações de <b>saneamento básico</b>.'],
      ['cf200b', 'CF/88, art. 200, V a VIII', 'Art. 200 da CF: competências do SUS (incisos V a VIII).',
        'V – <b>incrementar</b>, em sua área de atuação, o desenvolvimento científico e tecnológico e a inovação;<br>VI – <b>fiscalizar e inspecionar alimentos</b>, compreendido o controle de seu teor nutricional, bem como bebidas e águas para consumo humano;<br>VII – <b>participar do controle e fiscalização</b> da produção, transporte, guarda e utilização de substâncias e produtos psicoativos, tóxicos e radioativos;<br>VIII – <b>colaborar</b> na proteção do meio ambiente, nele compreendido o <b>do trabalho</b>.']
    ]
  },
  {
    group: 'Lei 8.080/90', topic: 'sus-leg', url: U.l8080,
    cards: [
      ['l8080a2', 'Lei 8.080, art. 2º', 'Art. 2º da Lei 8.080: em que consiste o dever do Estado? Ele exclui o dever de alguém?',
        'A saúde é um <b>direito fundamental do ser humano</b>, devendo o Estado prover as condições indispensáveis ao seu pleno exercício.<br>§1º O dever do Estado consiste na <b>formulação e execução de políticas econômicas e sociais</b> que visem à redução de riscos... e no estabelecimento de condições que assegurem acesso universal e igualitário.<br>§2º O dever do Estado <b>não exclui o das pessoas, da família, das empresas e da sociedade</b>.'],
      ['l8080a3', 'Lei 8.080, art. 3º', 'Quais determinantes e condicionantes da saúde a Lei 8.080 lista (art. 3º)?',
        'Entre outros: <b>alimentação, moradia, saneamento básico, meio ambiente, trabalho, renda, educação, atividade física, transporte, lazer</b> e acesso aos bens e serviços essenciais. Os níveis de saúde <b>expressam a organização social e econômica do País</b>.'],
      ['l8080a4', 'Lei 8.080, art. 4º', 'O que constitui o SUS (art. 4º) e como entra a iniciativa privada?',
        'O conjunto de ações e serviços de saúde prestados por órgãos e instituições <b>públicas federais, estaduais e municipais</b>, da administração <b>direta e indireta</b> e das <b>fundações mantidas pelo Poder Público</b>. Inclui instituições públicas de controle de qualidade, pesquisa e produção de insumos, medicamentos, sangue e hemoderivados.<br>§2º A iniciativa privada poderá participar do SUS em <b>caráter complementar</b>.'],
      ['l8080a5', 'Lei 8.080, art. 5º', 'Quais são os 3 objetivos do SUS (art. 5º)?',
        'I – a <b>identificação e divulgação</b> dos fatores condicionantes e determinantes da saúde;<br>II – a <b>formulação de política de saúde</b> destinada a promover, nos campos econômico e social, o disposto no §1º do art. 2º;<br>III – a <b>assistência</b> às pessoas por intermédio de ações de promoção, proteção e recuperação, com a realização <b>integrada</b> das ações assistenciais e das atividades preventivas.'],
      ['l8080a6i', 'Lei 8.080, art. 6º, I', 'Quais ações estão no campo de atuação do SUS (art. 6º, I)?',
        'Execução de ações: a) de <b>vigilância sanitária</b>; b) de <b>vigilância epidemiológica</b>; c) de <b>saúde do trabalhador</b>; d) de <b>assistência terapêutica integral, inclusive farmacêutica</b>; e) de <b>saúde bucal</b> (incluída pela Lei 14.572/2023).'],
      ['l8080visa', 'Lei 8.080, art. 6º, §1º', 'Defina vigilância sanitária segundo a Lei 8.080.',
        'Conjunto de ações capaz de <b>eliminar, diminuir ou prevenir riscos</b> à saúde e de <b>intervir</b> nos problemas sanitários decorrentes do meio ambiente, da produção e circulação de bens e da prestação de serviços de interesse da saúde, abrangendo o <b>controle de bens de consumo</b> (da produção ao consumo) e o <b>controle da prestação de serviços</b>.'],
      ['l8080ve', 'Lei 8.080, art. 6º, §2º', 'Defina vigilância epidemiológica segundo a Lei 8.080.',
        'Conjunto de ações que proporcionam o <b>conhecimento, a detecção ou prevenção</b> de qualquer mudança nos fatores determinantes e condicionantes de saúde individual ou coletiva, com a finalidade de <b>recomendar e adotar</b> as medidas de prevenção e controle das doenças ou agravos.'],
      ['l8080st', 'Lei 8.080, art. 6º, §3º', 'Como a Lei 8.080 define saúde do trabalhador?',
        'Conjunto de atividades que se destina, <b>através das ações de vigilância epidemiológica e vigilância sanitária</b>, à <b>promoção e proteção</b> da saúde dos trabalhadores, e visa à <b>recuperação e reabilitação</b> dos trabalhadores submetidos aos riscos e agravos advindos das condições de trabalho.'],
      ['l8080a7a', 'Lei 8.080, art. 7º, I a IV', 'Art. 7º da Lei 8.080 — princípios I a IV.',
        'I – <b>universalidade</b> de acesso aos serviços de saúde em <b>todos os níveis de assistência</b>;<br>II – <b>integralidade</b> de assistência, entendida como <b>conjunto articulado e contínuo</b> das ações e serviços preventivos e curativos, individuais e coletivos, exigidos para cada caso em todos os níveis de complexidade;<br>III – <b>preservação da autonomia</b> das pessoas na defesa de sua integridade física e moral;<br>IV – <b>igualdade</b> da assistência à saúde, sem preconceitos ou privilégios de qualquer espécie.'],
      ['l8080a7b', 'Lei 8.080, art. 7º, V a VIII', 'Art. 7º da Lei 8.080 — princípios V a VIII.',
        'V – <b>direito à informação</b>, às pessoas assistidas, sobre sua saúde;<br>VI – <b>divulgação de informações</b> quanto ao potencial dos serviços de saúde e a sua utilização pelo usuário;<br>VII – <b>utilização da epidemiologia</b> para o estabelecimento de prioridades, a alocação de recursos e a orientação programática;<br>VIII – <b>participação da comunidade</b>.'],
      ['l8080a7c', 'Lei 8.080, art. 7º, IX e X', 'Art. 7º da Lei 8.080 — princípios IX e X.',
        'IX – <b>descentralização político-administrativa</b>, com direção única em cada esfera de governo: a) <b>ênfase na descentralização dos serviços para os municípios</b>; b) <b>regionalização e hierarquização</b> da rede de serviços;<br>X – <b>integração em nível executivo</b> das ações de saúde, <b>meio ambiente e saneamento básico</b>.'],
      ['l8080a7d', 'Lei 8.080, art. 7º, XI a XIV', 'Art. 7º da Lei 8.080 — princípios XI a XIV.',
        'XI – <b>conjugação dos recursos</b> financeiros, tecnológicos, materiais e humanos da União, Estados, DF e Municípios;<br>XII – <b>capacidade de resolução</b> dos serviços em todos os níveis de assistência;<br>XIII – organização dos serviços públicos de modo a <b>evitar duplicidade de meios para fins idênticos</b>;<br>XIV – atendimento público específico e especializado para <b>mulheres e vítimas de violência doméstica</b> (Lei 13.427/2017).<br><i>Leis recentes incluíram novos incisos (ex.: atenção humanizada, Lei 15.126/2025) — confira a redação vigente.</i>'],
      ['l8080a8', 'Lei 8.080, art. 8º', 'Como as ações e serviços do SUS devem ser organizados (art. 8º)?',
        'Executados diretamente ou mediante participação complementar da iniciativa privada, serão organizados de forma <b>regionalizada e hierarquizada em níveis de complexidade crescente</b>.'],
      ['l8080a9', 'Lei 8.080, art. 9º', 'Quem exerce a direção única do SUS em cada esfera (art. 9º)?',
        'União: <b>Ministério da Saúde</b>; Estados e DF: respectiva <b>Secretaria de Saúde ou órgão equivalente</b>; Municípios: respectiva <b>Secretaria de Saúde ou órgão equivalente</b>.'],
      ['l8080a10', 'Lei 8.080, art. 10', 'O que os municípios podem constituir para desenvolver ações em conjunto (art. 10)?',
        '<b>Consórcios</b> para desenvolver em conjunto as ações e os serviços de saúde que lhes correspondam. No nível municipal, o SUS poderá organizar-se em <b>distritos</b>.'],
      ['l8080a14a', 'Lei 8.080, arts. 14-A e 14-B', 'O que são a CIB e a CIT? E o CONASS e o CONASEMS?',
        'CIB e CIT são reconhecidas como <b>foros de negociação e pactuação entre gestores</b>, quanto aos <b>aspectos operacionais</b> do SUS.<br>CONASS e CONASEMS são <b>entidades representativas</b> dos entes estaduais e municipais, declarados de <b>utilidade pública e de relevante função social</b>.'],
      ['l8080a16', 'Lei 8.080, art. 16, III', 'Que sistemas compete à direção nacional do SUS definir e coordenar (art. 16, III)?',
        'a) <b>redes integradas de assistência de alta complexidade</b>; b) <b>rede de laboratórios de saúde pública</b>; c) <b>vigilância epidemiológica</b>; d) <b>vigilância sanitária</b>.'],
      ['l8080a17', 'Lei 8.080, art. 17, I a III', 'Competências típicas da direção estadual (art. 17, I a III).',
        'I – <b>promover a descentralização</b> para os Municípios dos serviços e ações de saúde;<br>II – <b>acompanhar, controlar e avaliar</b> as redes hierarquizadas do SUS;<br>III – <b>prestar apoio técnico e financeiro</b> aos Municípios e <b>executar supletivamente</b> ações e serviços de saúde.'],
      ['l8080a18', 'Lei 8.080, art. 18, I e IV', 'Competências da direção municipal (art. 18, I e IV).',
        'I – <b>planejar, organizar, controlar e avaliar</b> as ações e serviços de saúde e <b>gerir e executar</b> os serviços públicos de saúde;<br>IV – <b>executar serviços</b>: de vigilância epidemiológica, vigilância sanitária, alimentação e nutrição, saneamento básico e saúde do trabalhador.'],
      ['l8080a19b', 'Lei 8.080, arts. 19-B, 19-C e 19-G', 'Subsistema de Atenção à Saúde Indígena: quem financia e como se organiza?',
        'É <b>componente do SUS</b>. Cabe à <b>União, com seus recursos próprios</b>, financiá-lo (Estados, Municípios e outras instituições podem atuar complementarmente). Deve ser, como o SUS, <b>descentralizado, hierarquizado e regionalizado</b>.'],
      ['l8080a19j', 'Lei 8.080, art. 19-J', 'Direito a acompanhante da parturiente no SUS: quantos e em que período?',
        'Os serviços do SUS, da rede própria ou conveniada, ficam obrigados a permitir a presença de <b>1 (um) acompanhante</b>, <b>indicado pela parturiente</b>, durante <b>todo o período de trabalho de parto, parto e pós-parto imediato</b>.'],
      ['l8080a19q', 'Lei 8.080, art. 19-Q', 'Quem decide incorporar, excluir ou alterar tecnologias no SUS?',
        'É atribuição do <b>Ministério da Saúde</b>, <b>assessorado pela Comissão Nacional de Incorporação de Tecnologias no SUS (CONITEC)</b>.'],
      ['l8080a24', 'Lei 8.080, arts. 24 e 25', 'Quando o SUS pode recorrer à iniciativa privada e quem tem preferência?',
        'Quando as suas disponibilidades forem <b>insuficientes para garantir a cobertura assistencial</b> da população de uma área. Nesse caso, as entidades <b>filantrópicas e as sem fins lucrativos</b> terão preferência.'],
      ['l8080a26', 'Lei 8.080, art. 26', 'Quem estabelece os critérios e valores de remuneração de serviços privados contratados?',
        'A <b>direção nacional do SUS</b>, com aprovação no <b>Conselho Nacional de Saúde</b> (inclui parâmetros de cobertura assistencial).'],
      ['l8080a28', 'Lei 8.080, art. 28', 'Em que regime devem ser exercidos os cargos de chefia, direção e assessoramento no SUS?',
        'Só poderão ser exercidos em <b>regime de tempo integral</b>.'],
      ['l8080a33', 'Lei 8.080, art. 33', 'Onde são depositados os recursos financeiros do SUS e quem fiscaliza a movimentação?',
        'Em <b>conta especial</b>, em cada esfera de atuação, movimentados sob <b>fiscalização dos respectivos Conselhos de Saúde</b>.'],
      ['l8080a36', 'Lei 8.080, art. 36', 'Como é o processo de planejamento e orçamento do SUS (art. 36)? Há vedação?',
        '<b>Ascendente, do nível local até o federal</b>, ouvidos seus órgãos deliberativos. É <b>vedada</b> a transferência de recursos para ações <b>não previstas nos planos de saúde</b>, exceto em situações <b>emergenciais ou de calamidade pública</b>.'],
      ['l8080a43', 'Lei 8.080, art. 43', 'A gratuidade vale nos serviços públicos contratados?',
        'Sim: a <b>gratuidade</b> das ações e serviços de saúde fica <b>preservada nos serviços públicos contratados</b>, ressalvando-se as cláusulas dos contratos ou convênios com entidades privadas.']
    ]
  },
  {
    group: 'Lei 8.142/90', topic: 'sus-gestao', url: U.l8142,
    cards: [
      ['l8142a1', 'Lei 8.142, art. 1º', 'Quais são as instâncias colegiadas do SUS em cada esfera de governo?',
        'I – a <b>Conferência de Saúde</b>; II – o <b>Conselho de Saúde</b> (sem prejuízo das funções do Poder Legislativo).'],
      ['l8142conf', 'Lei 8.142, art. 1º, §1º', 'Conferência de Saúde: periodicidade, finalidade e quem convoca.',
        'Reúne-se a <b>cada quatro anos</b>, com a representação dos vários segmentos sociais, para <b>avaliar a situação de saúde e propor as diretrizes</b> para a formulação da política de saúde. Convocada pelo <b>Poder Executivo</b> ou, extraordinariamente, <b>por ela própria ou pelo Conselho de Saúde</b>.'],
      ['l8142cons', 'Lei 8.142, art. 1º, §2º', 'Conselho de Saúde: caráter, composição e atuação.',
        'Em caráter <b>permanente e deliberativo</b>, órgão colegiado composto por representantes do <b>governo, prestadores de serviço, profissionais de saúde e usuários</b>; atua na <b>formulação de estratégias e no controle da execução</b> da política de saúde, <b>inclusive nos aspectos econômicos e financeiros</b>. Decisões <b>homologadas pelo chefe do poder</b> legalmente constituído em cada esfera.'],
      ['l8142par', 'Lei 8.142, art. 1º, §§4º e 5º', 'Como é a representação dos usuários nos Conselhos e Conferências? Quem aprova o regimento?',
        'A representação dos usuários é <b>paritária em relação ao conjunto dos demais segmentos</b> (50% usuários). Organização e normas de funcionamento em <b>regimento próprio, aprovado pelo respectivo conselho</b>.'],
      ['l8142a3', 'Lei 8.142, art. 3º, §2º', 'Qual a parcela mínima dos recursos do FNS repassados de forma regular e automática destinada aos Municípios?',
        '<b>Pelo menos setenta por cento</b> aos Municípios, afetando-se o restante aos Estados. Enquanto não regulamentado o art. 35 da Lei 8.080, usa-se exclusivamente o <b>critério populacional</b> (§1º do art. 35).'],
      ['l8142a4', 'Lei 8.142, art. 4º', 'O que Municípios, Estados e DF precisam ter para receber os recursos (art. 4º)?',
        'I – <b>Fundo de Saúde</b>; II – <b>Conselho de Saúde</b> com composição paritária; III – <b>plano de saúde</b>; IV – <b>relatórios de gestão</b>; V – <b>contrapartida</b> de recursos no orçamento; VI – <b>comissão de elaboração do PCCS</b> (prazo de dois anos para implantação). Sem isso, os recursos são administrados pelos <b>Estados ou pela União</b>.']
    ]
  },
  {
    group: 'Decreto 7.508/11', topic: 'sus-ras', url: U.d7508,
    cards: [
      ['d7508reg', 'Decreto 7.508, art. 2º, I', 'Defina Região de Saúde (Decreto 7.508).',
        'Espaço geográfico <b>contínuo</b> constituído por agrupamentos de <b>Municípios limítrofes</b>, delimitado a partir de <b>identidades culturais, econômicas e sociais</b> e de redes de comunicação e infraestrutura de transportes compartilhados, com a finalidade de <b>integrar a organização, o planejamento e a execução</b> de ações e serviços de saúde.'],
      ['d7508a4', 'Decreto 7.508, art. 4º', 'Quem institui as Regiões de Saúde?',
        'O <b>Estado, em articulação com os Municípios</b>, respeitadas as diretrizes gerais pactuadas na <b>CIT</b>.'],
      ['d7508a5', 'Decreto 7.508, art. 5º', 'O que uma Região de Saúde deve conter, no mínimo?',
        'Ações e serviços de: I – <b>atenção primária</b>; II – <b>urgência e emergência</b>; III – <b>atenção psicossocial</b>; IV – <b>atenção ambulatorial especializada e hospitalar</b>; V – <b>vigilância em saúde</b>.'],
      ['d7508a9', 'Decreto 7.508, art. 9º', 'Quais são as Portas de Entrada nas Redes de Atenção à Saúde?',
        'Serviços: I – de <b>atenção primária</b>; II – de <b>urgência e emergência</b>; III – de <b>atenção psicossocial</b>; IV – <b>especiais de acesso aberto</b>. Novas portas podem ser criadas mediante justificativa técnica e pactuação nas Comissões Intergestores.'],
      ['d7508a11', 'Decreto 7.508, art. 11', 'O acesso universal e igualitário é ordenado por quem e fundado em quê?',
        'Ordenado pela <b>atenção primária</b> e fundado na <b>avaliação da gravidade do risco individual e coletivo</b> e no <b>critério cronológico</b>, observadas as especificidades para pessoas com proteção especial.'],
      ['d7508defs', 'Decreto 7.508, art. 2º, III, V e VII', 'Defina Portas de Entrada, Mapa da Saúde e Serviços Especiais de Acesso Aberto.',
        '<b>Portas de Entrada</b>: serviços de atendimento <b>inicial</b> à saúde do usuário no SUS.<br><b>Mapa da Saúde</b>: descrição geográfica da distribuição de recursos humanos e de ações e serviços ofertados <b>pelo SUS e pela iniciativa privada</b>, considerando capacidade instalada, investimentos e desempenho.<br><b>Serviços Especiais de Acesso Aberto</b>: para a pessoa que, em razão de <b>agravo ou de situação laboral</b>, necessita de atendimento especial.'],
      ['d7508coap', 'Decreto 7.508, art. 2º, II', 'O que é o COAP?',
        'Contrato Organizativo da Ação Pública da Saúde: <b>acordo de colaboração entre entes federativos</b> para organizar e integrar as ações e serviços na rede regionalizada e hierarquizada, com definição de <b>responsabilidades, indicadores e metas</b>, critérios de avaliação de desempenho, recursos financeiros e forma de controle e fiscalização.'],
      ['d7508ci', 'Decreto 7.508, art. 2º, IV e art. 30', 'O que são as Comissões Intergestores e a que órgão cada uma se vincula?',
        'Instâncias de <b>pactuação consensual</b> entre os entes para definir as regras da gestão compartilhada. <b>CIT</b> (União) – vinculada ao <b>Ministério da Saúde</b>; <b>CIB</b> (Estado) e <b>CIR</b> (região) – vinculadas à <b>Secretaria Estadual de Saúde</b>; a CIR observa as diretrizes da CIB.'],
      ['d7508ras', 'Decreto 7.508, art. 2º, VI', 'Defina Rede de Atenção à Saúde segundo o Decreto 7.508.',
        'Conjunto de ações e serviços de saúde articulados em <b>níveis de complexidade crescente</b>, com a finalidade de garantir a <b>integralidade</b> da assistência à saúde.'],
      ['d7508renases', 'Decreto 7.508, arts. 21 a 25', 'O que são RENASES e RENAME? Com que frequência são atualizadas?',
        '<b>RENASES</b>: todas as ações e serviços que o SUS oferece ao usuário para atendimento da integralidade. <b>RENAME</b>: seleção e padronização de medicamentos indicados para doenças ou agravos no SUS. Ambas consolidadas e publicadas pelo Ministério da Saúde <b>a cada dois anos</b>.'],
      ['d7508a28', 'Decreto 7.508, art. 28', 'Requisitos cumulativos para o acesso à assistência farmacêutica no SUS.',
        'I – usuário <b>assistido por ações e serviços do SUS</b>; II – medicamento <b>prescrito por profissional de saúde no exercício regular de suas funções no SUS</b>; III – prescrição conforme a <b>RENAME e os PCDT</b> (ou relação complementar estadual/municipal); IV – <b>dispensação em unidades indicadas</b> pela direção do SUS.'],
      ['d7508a15', 'Decreto 7.508, art. 15', 'Como deve ser o planejamento da saúde? É obrigatório para quem?',
        '<b>Ascendente e integrado</b>, do nível local até o federal, ouvidos os Conselhos de Saúde. É <b>obrigatório para os entes públicos</b> e será <b>indutor de políticas para a iniciativa privada</b>.']
    ]
  },
  {
    group: 'LC 141/12', topic: 'sus-gestao', url: U.lc141,
    cards: [
      ['lc141a2', 'LC 141, art. 2º', 'Quais critérios uma despesa precisa atender para ser considerada ação e serviço público de saúde (ASPS)?',
        'Ser destinada a ações e serviços de acesso <b>universal, igualitário e gratuito</b>; estar em conformidade com objetivos e metas dos <b>Planos de Saúde</b>; ser de <b>responsabilidade específica do setor da saúde</b> (não se aplica a despesas de outras políticas que atuam sobre determinantes sociais e econômicos).'],
      ['lc141a3', 'LC 141, art. 3º', 'Cite despesas que CONTAM como ASPS (art. 3º).',
        'Vigilância em saúde; atenção integral em todos os níveis; <b>capacitação do pessoal</b> do SUS; desenvolvimento científico; produção e distribuição de insumos; <b>saneamento básico de domicílios ou pequenas comunidades</b> (aprovado pelo Conselho), dos <b>DSEI e de quilombolas</b>; manejo ambiental para controle de vetores; investimento na rede física; <b>remuneração do pessoal ativo</b> em ações de saúde; apoio administrativo e gestão.'],
      ['lc141a4', 'LC 141, art. 4º', 'Cite despesas que NÃO contam como ASPS (art. 4º).',
        '<b>Aposentadorias e pensões</b> (inclusive de servidores da saúde); pessoal em atividade alheia à saúde; assistência <b>não universal</b> (clientela fechada); <b>merenda escolar</b>; saneamento básico custeado por taxas/tarifas; <b>limpeza urbana</b> e remoção de resíduos; preservação do meio ambiente por órgãos ambientais; <b>assistência social</b>; <b>obras de infraestrutura</b>, ainda que beneficiem a rede de saúde.'],
      ['lc141fundo', 'LC 141, art. 14', 'O que é o Fundo de Saúde segundo a LC 141?',
        'Instituído <b>por lei</b> e mantido pela administração direta de cada ente, constitui-se em <b>unidade orçamentária e gestora</b> dos recursos destinados a ASPS.'],
      ['lc141rel', 'LC 141, art. 36', 'Relatório detalhado do quadrimestre (RDQA) e Relatório Anual de Gestão: prazos.',
        'RDQA: apresentado em <b>audiência pública na Casa Legislativa</b> até o fim de <b>maio, setembro e fevereiro</b>. RAG: enviado ao <b>Conselho de Saúde até 30 de março</b> do ano seguinte.']
    ]
  },
  {
    group: 'PNAB 2017', topic: 'sus-aps', url: U.pnab,
    cards: [
      ['pnabdef', 'PNAB (Portaria 2.436/2017), art. 2º', 'Defina Atenção Básica segundo a PNAB 2017.',
        'Conjunto de ações de saúde <b>individuais, familiares e coletivas</b> que envolvem promoção, prevenção, proteção, diagnóstico, tratamento, reabilitação, <b>redução de danos, cuidados paliativos e vigilância em saúde</b>, por meio de práticas de cuidado integrado e gestão qualificada, com <b>equipe multiprofissional</b>, dirigida à população em <b>território definido</b>, sobre a qual as equipes assumem <b>responsabilidade sanitária</b>.'],
      ['pnabporta', 'PNAB, art. 2º, §1º', 'Qual o papel da Atenção Básica na RAS?',
        'É a <b>principal porta de entrada</b> e <b>centro de comunicação</b> da RAS, <b>coordenadora do cuidado</b> e <b>ordenadora</b> das ações e serviços disponibilizados na rede.'],
      ['pnabprinc', 'PNAB, art. 3º', 'Princípios e diretrizes do SUS e da RAS operacionalizados na Atenção Básica (PNAB 2017).',
        'Princípios: <b>universalidade, equidade e integralidade</b>.<br>Diretrizes: <b>regionalização e hierarquização; territorialização; população adscrita; cuidado centrado na pessoa; resolutividade; longitudinalidade do cuidado; coordenação do cuidado; ordenação da rede; participação da comunidade</b>.'],
      ['pnabesf', 'PNAB, art. 4º', 'Qual é a estratégia prioritária da PNAB para expansão e consolidação da Atenção Básica?',
        'A <b>Saúde da Família</b>. Outras estratégias de AB são reconhecidas, desde que observem os princípios e diretrizes da PNAB.'],
      ['pnabpop', 'PNAB 2017, Anexo', 'População adscrita recomendada por equipe de Saúde da Família e cobertura de ACS em áreas vulneráveis.',
        '<b>2.000 a 3.500 pessoas</b> por eSF (podendo variar conforme vulnerabilidade). Em áreas de risco e vulnerabilidade, <b>100% de cobertura por ACS</b>, com no máximo <b>750 pessoas por ACS</b>.'],
      ['pnabesb', 'PNAB 2017, Anexo', 'Composição das modalidades de equipe de Saúde Bucal (eSB).',
        '<b>Modalidade I</b>: cirurgião-dentista + <b>ASB ou TSB</b>.<br><b>Modalidade II</b>: cirurgião-dentista + <b>TSB</b> + ASB ou outro TSB. Carga horária de <b>40 horas semanais</b> na Saúde da Família.']
    ]
  },
  {
    group: 'Saúde Bucal (PNSB/CEO)', topic: 'sb-col', url: U.l14572,
    cards: [
      ['pnsb14572', 'Lei 14.572/2023, art. 1º', 'O que fez a Lei 14.572/2023?',
        'Instituiu a <b>Política Nacional de Saúde Bucal</b> no âmbito do SUS e alterou a <b>Lei 8.080</b> para <b>incluir a saúde bucal no campo de atuação do SUS</b> (art. 6º, I, “e”).'],
      ['pnsbeixos', 'Diretrizes da PNSB (2004)', 'Quais as principais linhas de ação do Brasil Sorridente (Diretrizes da PNSB, 2004)?',
        'Reorganização da <b>atenção básica</b> (eSB na Saúde da Família); ampliação e qualificação da <b>atenção especializada</b> (CEO e Laboratórios Regionais de Prótese Dentária – LRPD); <b>fluoretação das águas</b> de abastecimento público; vigilância em saúde bucal.', null],
      ['ceotipos', 'Portaria GM/MS 599/2006 (consolidada)', 'Tipos de CEO pelo número de cadeiras odontológicas.',
        '<b>CEO tipo I</b>: 3 cadeiras; <b>tipo II</b>: 4 a 6 cadeiras; <b>tipo III</b>: 7 ou mais cadeiras.', null],
      ['ceomin', 'Portaria GM/MS 599/2006 (consolidada)', 'Quais especialidades/serviços mínimos um CEO deve ofertar?',
        '<b>Diagnóstico bucal, com ênfase no diagnóstico e detecção do câncer de boca</b>; <b>periodontia especializada</b>; <b>cirurgia oral menor</b> dos tecidos moles e duros; <b>endodontia</b>; <b>atendimento a portadores de necessidades especiais</b>.', null]
    ]
  },
  {
    group: 'Exercício profissional e ética', topic: 'etica-odonto', url: U.l5081,
    cards: [
      ['l5081a6', 'Lei 5.081/1966, art. 6º', 'O que compete ao cirurgião-dentista pela Lei 5.081/66 (principais incisos)?',
        'Praticar todos os atos pertinentes à Odontologia decorrentes de curso regular ou pós-graduação; <b>prescrever e aplicar especialidades farmacêuticas de uso interno e externo</b> indicadas em Odontologia; <b>atestar estados mórbidos</b>, inclusive para justificar faltas ao emprego; proceder à perícia odontolegal; <b>aplicar anestesia local e truncular</b>; utilizar, como perito, as <b>vias de acesso do pescoço e da cabeça</b> em necropsia.'],
      ['l11889sup', 'Lei 11.889/2008', 'TSB e ASB podem atuar sem supervisão?',
        'Não. O <b>TSB</b> atua <b>sempre sob a supervisão do cirurgião-dentista</b>; o <b>ASB</b>, sob supervisão do <b>cirurgião-dentista ou do TSB</b>. É vedado a ambos <b>exercer a atividade de forma autônoma</b>.', U.l11889],
      ['l11889tsb', 'Lei 11.889/2008, art. 5º', 'Cite atividades privativas do TSB na Lei 11.889/2008.',
        'Remover <b>indutos, placas e cálculos supragengivais</b>; <b>inserir e distribuir no preparo cavitário</b> materiais da restauração direta (vedado o uso de materiais e instrumentos não indicados pelo CD); <b>remover suturas</b>; aplicar medidas de biossegurança; realizar fotografias e tomadas radiográficas intraorais e extraorais; participar de treinamento de ASB e de levantamentos epidemiológicos.', U.l11889],
      ['ceopront', 'Código de Ética Odontológica (Res. CFO 118/2012)', 'O que o Código de Ética Odontológica exige quanto ao prontuário?',
        'É <b>obrigatória</b> a elaboração e a manutenção, de forma <b>legível e atualizada</b>, de prontuário e a sua <b>conservação em arquivo próprio</b>, seja de forma <b>física ou digital</b>.', null],
      ['ceosigilo', 'Código de Ética Odontológica (Res. CFO 118/2012)', 'Revelar fato sigiloso é sempre infração ética?',
        'Constitui infração ética <b>revelar, sem justa causa</b>, fato sigiloso de que tenha conhecimento em razão do exercício da profissão. Há <b>justa causa</b>, por exemplo, em <b>notificação compulsória</b>, colaboração com a justiça em casos previstos em lei, perícia e revelação ao responsável quando o paciente é menor/incapaz.', null]
    ]
  }
]

export const LEI_SECA: Flashcard[] = groups.flatMap((g) =>
  g.cards.map(([id, src, f, b, url]) => ({ id: `lei:${id}`, deck: 'lei' as const, group: g.group, topic: g.topic, f, b, src, url: url === null ? undefined : url ?? g.url }))
)

export const LEI_GROUPS = groups.map((g) => g.group)
