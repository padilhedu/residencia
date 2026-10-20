import type { ExamId, PlanItem } from '../lib/types'
import { REFS as R, TOPIC_MAP } from './topics'

/**
 * Plano de 30 dias para a prova FDT 2026 (Processo Seletivo Unificado — SES/SC e demais instituições),
 * com foco nos CONHECIMENTOS ESPECÍFICOS de Odontologia (40 das 60 questões) e nas provas antigas da Fundatec.
 *
 * Cada dia de estudo: questões do tema primeiro (FDT 2023–2025, depois ENARE), teoria dirigida só no que a banca
 * cobra, revisão espaçada + flashcards e manutenção do bloco geral (SUS).
 */
export const SPRINT = {
  id: 'fdt30',
  start: '2026-10-20',
  exam: '2026-11-22',
  title: 'Plano de 30 dias — FDT 2026 (foco em específicos)'
}

export type SprintKind = 'estudo' | 'simulado' | 'revisao' | 'descanso' | 'prova'

export interface SprintDay {
  date: string
  kind: SprintKind
  title: string
  focus?: string
  items: PlanItem[]
}

interface Spec {
  date: string
  kind?: SprintKind
  title: string
  focus?: string
  /** Temas das questões do dia (FDT primeiro, depois ENARE) */
  topics?: string[]
  n?: number
  /** Teoria dirigida: o que estudar (só o que a banca cobra) */
  teoria?: string[]
  refs?: { t: string; url?: string }[]
  /** Manutenção do bloco geral: 10 questões de SUS ou flashcards de lei seca */
  sus?: 'q' | 'lei'
  sim?: { exam: ExamId; range?: [number, number]; text: string }
  extra?: Omit<PlanItem, 'id'>[]
}

const DAYS: Spec[] = [
  // ───────── Semana 1: os 3 blocos que mais caem (cirurgia, CTBMF, saúde bucal coletiva) ─────────
  {
    date: '2026-10-20', kind: 'simulado', title: 'Diagnóstico: específicas da FDT 2023',
    focus: 'Antes de estudar, descubra onde você está. ⚠️ Inscrição até hoje (20/10) e cadastro do currículo até amanhã (21/10) — o currículo vale 10% da nota final na SES/SC.',
    sim: { exam: 'fdt2023', range: [21, 60], text: 'Simulado diagnóstico: FDT 2023, questões 21–60 (40 específicas, 2 h 40)' },
    extra: [
      { kind: 'revisao', text: 'Corrigir o simulado marcando o tipo de cada erro (conteúdo, interpretação, desatenção)' },
      { kind: 'revisao', text: 'Conferir inscrição e anexar o currículo + requerimento de pontuação (Anexo II) na plataforma Fundatec até 21/10' }
    ]
  },
  {
    date: '2026-10-21', title: 'Cirurgia oral I — exodontia e terceiros molares',
    focus: 'Cirurgia oral é o 2º tema que mais cai nas específicas da Fundatec (12 questões em 3 provas).',
    topics: ['cir'], n: 20, sus: 'q',
    teoria: [
      'Classificações de Pell & Gregory e Winter; indicações e contraindicações da remoção de 3º molar',
      'Retalhos (envelope, triangular, trapezoidal), osteotomia, odontossecção e suturas; princípios de técnica e instrumental',
      'Complicações: alveolite, hemorragia, comunicação buco-sinusal, lesão do alveolar inferior e do lingual, fratura de tuberosidade/mandíbula',
      'Cicatrização alveolar e cuidados pós-operatórios'
    ],
    refs: [R.gil, R.hupp, R.puricelli]
  },
  {
    date: '2026-10-22', title: 'Anestesia local, anatomia aplicada e cirurgia (2ª rodada)',
    focus: 'Anestesia e anatomia andam juntas na FDT (11 questões em 3 provas); as questões de cirurgia que sobraram de ontem entram no fim.',
    topics: ['anest', 'anato', 'cir'], n: 25, sus: 'lei',
    teoria: [
      'Tabela de doses máximas (mg/kg e dose máxima absoluta) e cálculo do número de tubetes',
      'Vasoconstritores: indicações e limites em cardiopatas/hipertensos; anestésicos sem vaso',
      'Técnicas: alveolar inferior, Gow-Gates, Vazirani-Akinosi, infraorbitário, alveolares superiores, nasopalatino e palatino maior — marcos anatômicos',
      'Complicações locais e sistêmicas: toxicidade, metemoglobinemia, paralisia facial transitória, trismo, hematoma, parestesia',
      'Anatomia: trigêmeo (V2/V3), nervo facial, artéria maxilar e espaços fasciais'
    ],
    refs: [R.malamedAL, R.puricelliAL]
  },
  {
    date: '2026-10-23', title: 'CTBMF I — trauma de face',
    focus: 'Trauma de face/CTBMF é o maior bloco cirúrgico da FDT (13 questões; 7 só em 2025).',
    topics: ['ctbmf'], n: 15, sus: 'q',
    teoria: [
      'Atendimento inicial ao politraumatizado (ABCDE), via aérea e controle de hemorragia na face',
      'Fraturas de mandíbula: locais mais frequentes, favoráveis × desfavoráveis, tratamento (fixação interna × bloqueio maxilomandibular)',
      'Le Fort I, II e III; complexo zigomático-maxilar; órbita (blow-out) e naso-órbito-etmoidal: sinais clínicos e exames',
      'Epidemiologia do trauma facial (causas, faixa etária, ossos mais acometidos)'
    ],
    refs: [R.fonseca, R.prado, R.wulkan]
  },
  {
    date: '2026-10-24', title: 'CTBMF II — acessos, ATM cirúrgica e infecções',
    topics: ['ctbmf', 'infec'], n: 20, sus: 'lei',
    teoria: [
      'Acessos cirúrgicos ao esqueleto facial: subciliar, transconjuntival, Risdon/submandibular, retromandibular, pré-auricular, coronal — estruturas em risco (ramo marginal da mandíbula, frontal)',
      'Cirurgia ortognática: indicações e osteotomias básicas (Le Fort I, sagital do ramo)',
      'Infecções odontogênicas: espaços fasciais, angina de Ludwig, sinais de gravidade, drenagem, antibioticoterapia',
      'Cirurgia da ATM: anquilose, luxação recidivante'
    ],
    refs: [R.ellis, R.miloro, R.stevao]
  },
  {
    date: '2026-10-25', kind: 'simulado', title: 'Simulado: FDT 2024 completa',
    focus: '60 questões em 4 h (4 min/questão). Corrija no mesmo dia e anote os erros por tema.',
    sim: { exam: 'fdt2024', text: 'Simulado FDT 2024 completo (60 questões, 4 h)' },
    extra: [{ kind: 'revisao', text: 'Correção: refazer as erradas lendo o comentário e marcar o tipo de erro' }]
  },
  // ───────── Semana 2: saúde bucal coletiva, cariologia, estomatologia, DTM ─────────
  {
    date: '2026-10-26', title: 'Saúde bucal coletiva I — PNSB, Lei 14.572 e rede',
    focus: 'É o tema nº 1 das específicas da Fundatec (14 questões em 3 provas), sempre a partir de documento oficial.',
    topics: ['sb-col', 'sus-aps'], n: 20, sus: 'q',
    teoria: [
      'Diretrizes da PNSB 2004 (Brasil Sorridente): pressupostos, eixos e linhas de cuidado',
      'Lei 14.572/2023: o que mudou na Lei 8.080 e as diretrizes da Política Nacional de Saúde Bucal',
      'Rede: eSB na APS (modalidades I e II), CEO (tipos, especialidades mínimas, referência e contrarreferência), LRPD',
      'A saúde bucal no SUS (MS, 2018): atribuições do CD e da eSB na PNAB'
    ],
    refs: [R.l14572, R.pnsb2004, R.sbSus, R.manualEsp]
  },
  {
    date: '2026-10-27', title: 'Saúde bucal coletiva II — SB Brasil 2023 e fluoretos',
    topics: ['sb-col', 'cario'], n: 15, sus: 'lei',
    teoria: [
      'SB Brasil 2023 × 2010: CPO-D aos 12 anos, cárie na primeira infância, edentulismo e uso/necessidade de prótese, desigualdades regionais',
      'Guia de recomendações para o uso de fluoretos (2ª ed., 2026): água fluoretada, dentifrício (concentração e quantidade por idade), verniz, cariostático, fluorose',
      'Indicadores e vigilância em saúde bucal'
    ],
    refs: [R.fluor, R.sb2023, R.sbComp]
  },
  {
    date: '2026-10-28', title: 'Cariologia e dentística minimamente invasiva',
    topics: ['cario', 'odontoped'], n: 15, sus: 'q',
    teoria: [
      'Etiologia multifatorial, dieta e biofilme; atividade de lesão (Maltz)',
      'ICDAS: códigos e decisão de tratamento',
      'Remoção seletiva de tecido cariado, selantes, tratamento não restaurador (Firoozmand)',
      'Materiais: adesivos, resinas, ionômero de vidro (Passos; Baratieri)',
      'Hipomineralização molar-incisivo: diagnóstico e manejo'
    ],
    refs: [R.maltz, R.icdas, R.firoozmand, R.passos, R.hmi]
  },
  {
    date: '2026-10-29', title: 'Estomatologia I — câncer de boca e lesões potencialmente malignas',
    topics: ['estomato'], n: 20, sus: 'lei',
    teoria: [
      'Leucoplasia, eritroplasia, queilite actínica, líquen plano: risco de transformação e conduta',
      'Carcinoma espinocelular: fatores de risco, sítios, apresentação clínica, estadiamento básico',
      'Diagnóstico precoce do câncer de boca (INCA, 2022) e biópsia (incisional × excisional)',
      'Programa de navegação da pessoa com câncer (Portaria GM/MS 6.592/2025)'
    ],
    refs: [R.inca, R.neville, R.navegacao]
  },
  {
    date: '2026-10-30', title: 'Estomatologia II + cistos e tumores',
    topics: ['estomato', 'pato'], n: 15, sus: 'q',
    teoria: [
      'Infecções (candidíase, herpes, sífilis — CAB 18) e lesões imunomediadas (pênfigo, penfigoide, eritema multiforme)',
      'Cistos odontogênicos (radicular, dentígero, ceratocisto) e tumores (ameloblastoma, odontoma, mixoma): aspecto radiográfico e tratamento',
      'Lesões fibro-ósseas e de células gigantes',
      'Osteonecrose dos maxilares associada a bifosfonatos: estágios e prevenção'
    ],
    refs: [R.neville, R.cab18, R.souzaONM]
  },
  {
    date: '2026-10-31', title: 'ATM/DTM e radiologia',
    topics: ['dtm', 'radio'], n: 15, sus: 'lei',
    teoria: [
      'Okeson: classificação das DTM, deslocamento de disco com e sem redução, dor miofascial, bruxismo; tratamento conservador e placas',
      'Luxação da ATM e anquilose: manobras e tratamento cirúrgico (Stevão)',
      'Radiologia: técnicas intra e extraorais, TCFC, princípios de interpretação, proteção radiológica'
    ],
    refs: [R.okeson, R.stevao, R.white, R.radioUnasus]
  },
  {
    date: '2026-11-01', kind: 'revisao', title: 'Revisão da quinzena + específicas do ENARE',
    focus: 'Refaça seus erros e treine com as específicas do ENARE (estilo FGV, mesmo conteúdo).',
    extra: [
      { kind: 'questoes', text: 'Refazer todas as questões erradas desde 20/10', action: 'erros' },
      { kind: 'simulado', text: 'Simulado: ENARE 2026/27, questões 21–60 (40 específicas, 2 h)', exam: 'enare2026', range: [21, 60] },
      { kind: 'revisao', text: 'Flashcards: baralho "Meus erros"', action: 'cards' }
    ]
  },
  // ───────── Semana 3: emergências, farmacologia, hospitalar, PNH/PNAB, trauma dental, perio, ética ─────────
  {
    date: '2026-11-02', title: 'Emergências médicas no consultório',
    topics: ['emerg'], n: 10, sus: 'q',
    teoria: [
      'Prevenção: avaliação física, ASA, sinais vitais',
      'Síncope, hipoglicemia, crise hipertensiva, crise asmática, convulsão, anafilaxia (adrenalina: via e dose), angina/IAM',
      'Suporte básico de vida e kit de emergência',
      'CFO: o que são urgências × emergências odontológicas'
    ],
    refs: [R.malamedEm, R.cfoUrg]
  },
  {
    date: '2026-11-03', title: 'Farmacologia + pacientes sistemicamente comprometidos',
    topics: ['farmaco', 'especiais'], n: 15, sus: 'lei',
    teoria: [
      'Analgésicos e AINEs: escolha e contraindicações; corticoides',
      'Antibióticos: indicações reais, amoxicilina × clindamicina, profilaxia antibiótica (endocardite)',
      'Anticoagulados e antiagregados, hipertensos, diabéticos, gestantes, renais e hepatopatas: o que muda na conduta'
    ],
    refs: [R.wann, R.malamedEm]
  },
  {
    date: '2026-11-04', title: 'Odontologia hospitalar, UTI e oncologia',
    focus: 'Todos os programas de Odontologia da SES/SC são hospitalares (UTI, oncologia, criança e adolescente, CTBMF): vale caprichar.',
    topics: ['hospitalar', 'especiais'], n: 10, sus: 'q',
    teoria: [
      'UTI: higiene bucal e prevenção de pneumonia associada à ventilação (clorexidina), avaliação do paciente intubado',
      'Paciente oncológico: adequação bucal antes da radio/quimio, mucosite, xerostomia, osteorradionecrose, cárie de radiação',
      'Medicina bucal hospitalar: interconsulta, paciente imunossuprimido e hematológico'
    ],
    refs: [R.uti, R.hospEduardo, R.vieiraOnco, R.hospSantos]
  },
  {
    date: '2026-11-05', title: 'PNH, PNAB e vigilância (dentro das específicas)',
    focus: 'A Fundatec põe PNH e PNAB também no bloco específico de Odontologia (10 questões em 3 provas).',
    topics: ['sus-pnh', 'sus-aps', 'sus-vig'], n: 20, sus: 'lei',
    teoria: [
      'PNH (folheto 2013): princípios (transversalidade, indissociabilidade atenção-gestão, protagonismo) e diretrizes (acolhimento, gestão participativa/cogestão, ambiência, clínica ampliada, valorização do trabalhador, defesa dos direitos dos usuários)',
      'PNAB 2017: princípios e diretrizes, atribuições comuns e do cirurgião-dentista, eSB',
      'Guia de vigilância em saúde: notificação compulsória e doenças com manifestação bucal'
    ],
    refs: [R.pnhFolheto, R.pnab, R.guiaVig1]
  },
  {
    date: '2026-11-06', title: 'Trauma dentoalveolar, endodontia e odontopediatria',
    topics: ['trauma', 'endo', 'odontoped'], n: 15, sus: 'q',
    teoria: [
      'Traumatismo: concussão, subluxação, luxações, avulsão (meio de armazenamento, tempo extraoral, reimplante, contenção)',
      'Diagnóstico pulpar e periapical (Gaines; Estrela): pulpite reversível × irreversível, necrose, abscesso',
      'Odontopediatria: manejo, HMI, cárie na primeira infância'
    ],
    refs: [R.estrela, R.gaines, R.hmi]
  },
  {
    date: '2026-11-07', title: 'Periodontia + ética e resoluções do CFO (novidades 2026)',
    focus: 'O Anexo I de 2026 trouxe 4 resoluções novas do CFO e a diretriz de periodontite de 2025: bancas adoram novidade.',
    topics: ['perio', 'etica-odonto'], n: 10, sus: 'lei',
    teoria: [
      'Classificação 2018: estágios e graus da periodontite, saúde e gengivite, peri-implantite',
      'Diretriz do MS (2025) para periodontite estágios I–III na APS',
      'Código de Ética (Res. CFO 118/2012): direitos, deveres, sigilo, prontuário, publicidade',
      'Resoluções CFO 196 (selfies), 198 (HOF), 218 (fora do consultório) e as de 2026: 284 (área de atuação em cabeça e pescoço), 286 (cirurgia estética orofacial), 295 (sedação consciente), 296 (título de especialista via residência)'
    ],
    refs: [R.perioClass, R.perioMS, R.ceo118, R.cfo284, R.cfo286, R.cfo295, R.cfo296]
  },
  {
    date: '2026-11-08', kind: 'simulado', title: 'Simulado: FDT 2025 completa',
    focus: 'A prova mais recente da Fundatec: o termômetro mais fiel do estilo de 2026.',
    sim: { exam: 'fdt2025', text: 'Simulado FDT 2025 completo (60 questões, 4 h)' },
    extra: [{ kind: 'revisao', text: 'Correção por tema: anotar os 3 temas com mais erros (o app mostra em Revisão → Temas críticos)' }]
  },
  // ───────── Semana 4: consolidar pelos erros nos temas que mais pontuam ─────────
  {
    date: '2026-11-09', kind: 'revisao', title: 'Consolidação: cirurgia oral + anestesia',
    topics: ['cir', 'anest', 'anato'], n: 15, sus: 'q',
    teoria: ['Reler só o que você errou (comentários + anotações) e montar uma folha-resumo de doses e complicações'],
    extra: [{ kind: 'questoes', text: 'Refazer os erros de cirurgia, anestesia e anatomia', action: 'erros', topics: ['cir', 'anest', 'anato'] }]
  },
  {
    date: '2026-11-10', kind: 'revisao', title: 'Consolidação: CTBMF + infecções',
    topics: ['ctbmf', 'infec'], n: 15, sus: 'lei',
    teoria: ['Folha-resumo: classificação das fraturas, sinais clínicos, acessos e estruturas em risco, espaços fasciais'],
    extra: [{ kind: 'questoes', text: 'Refazer os erros de CTBMF e infecções', action: 'erros', topics: ['ctbmf', 'infec'] }]
  },
  {
    date: '2026-11-11', kind: 'revisao', title: 'Consolidação: saúde bucal coletiva + cariologia',
    topics: ['sb-col', 'cario'], n: 15, sus: 'q',
    teoria: ['Folha-resumo: CEO (tipos e especialidades), modalidades de eSB, dados do SB Brasil 2023, recomendações de flúor por idade'],
    extra: [{ kind: 'questoes', text: 'Refazer os erros de saúde bucal coletiva e cariologia', action: 'erros', topics: ['sb-col', 'cario', 'sus-aps'] }]
  },
  {
    date: '2026-11-12', kind: 'revisao', title: 'Consolidação: estomatologia, patologia e hospitalar',
    topics: ['estomato', 'pato', 'hospitalar'], n: 15, sus: 'lei',
    teoria: ['Quadro de diagnóstico diferencial: lesões brancas, vermelhas, ulceradas e radiolúcidas'],
    extra: [{ kind: 'questoes', text: 'Refazer os erros de estomatologia, patologia e hospitalar', action: 'erros', topics: ['estomato', 'pato', 'hospitalar'] }]
  },
  {
    date: '2026-11-13', kind: 'revisao', title: 'Reforço dirigido pelos seus 3 temas mais fracos',
    focus: 'O app escolhe os temas pelo seu % de acerto.', sus: 'q',
    extra: [
      { kind: 'questoes', text: 'Reforço 1: 15 questões dos 3 temas mais fracos', action: 'reforco' },
      { kind: 'questoes', text: 'Reforço 2: mais 15 questões (depois de rever a teoria do pior tema)', action: 'reforco' }
    ]
  },
  {
    date: '2026-11-14', kind: 'revisao', title: 'Consolidação: DTM, emergências, PNH/PNAB e novidades 2026',
    topics: ['dtm', 'emerg', 'sus-pnh'], n: 15, sus: 'lei',
    teoria: ['Novidades do Anexo I 2026: resoluções CFO 284/286/295/296, guia de fluoretos 2026, diretriz de periodontite 2025, Portaria 6.592/2025, SB Brasil 2023, Odontologia hospitalar (2026)']
  },
  {
    date: '2026-11-15', kind: 'simulado', title: 'Simulado misto (60 questões de todas as provas)',
    focus: '20 gerais + 40 específicas escolhidas pelo app (prioriza o que você errou e o que ainda não viu), 4 h.',
    extra: [{ kind: 'simulado', text: 'Simulado misto: 20 gerais + 40 específicas (4 h)', action: 'misto' }]
  },
  // ───────── Semana da prova ─────────
  {
    date: '2026-11-16', kind: 'revisao', title: 'Só os erros',
    focus: 'Nada de conteúdo novo: o que você já errou é o que mais pode virar ponto.', sus: 'q',
    extra: [
      { kind: 'questoes', text: 'Refazer todas as questões específicas que você errou', action: 'erros', topics: [] },
      { kind: 'revisao', text: 'Flashcards: baralho "Meus erros"', action: 'cards' }
    ]
  },
  {
    date: '2026-11-17', kind: 'simulado', title: 'Último simulado: 40 específicas',
    extra: [{ kind: 'simulado', text: 'Simulado de específicas: 40 questões escolhidas pelo app (2 h 40)', action: 'misto-esp' }]
  },
  {
    date: '2026-11-18', kind: 'revisao', title: 'Bloco geral: lei seca e políticas',
    focus: 'As 20 gerais valem 1/3 da prova: um dia inteiro para garantir os 50% mínimos com folga.',
    extra: [
      { kind: 'questoes', text: '20 questões do bloco geral (SUS)', action: 'gerais', n: 20 },
      { kind: 'lei', text: 'Flashcards de lei seca: CF/88, Lei 8.080, Lei 8.142 e Decreto 7.508', action: 'cards' }
    ]
  },
  {
    date: '2026-11-19', kind: 'revisao', title: 'Revisão leve: folhas-resumo',
    extra: [
      { kind: 'revisao', text: 'Reler as folhas-resumo (cirurgia/anestesia, CTBMF, saúde bucal coletiva, estomatologia)' },
      { kind: 'revisao', text: 'Zerar a fila de revisão espaçada', action: 'revisao' }
    ]
  },
  {
    date: '2026-11-20', kind: 'revisao', title: 'Revisão leve: novidades e tabelas',
    extra: [
      { kind: 'revisao', text: 'Novidades 2026 (resoluções CFO, guia de fluoretos, diretriz de periodontite) e tabelas de doses' },
      { kind: 'revisao', text: 'Flashcards do dia (15 min)', action: 'cards' }
    ]
  },
  {
    date: '2026-11-21', kind: 'descanso', title: 'Descanso e logística',
    extra: [
      { kind: 'revisao', text: 'Conferir local de prova (www.acm.org.br), documento com foto e caneta; dormir cedo' }
    ]
  },
  {
    date: '2026-11-22', kind: 'prova', title: 'PROVA FDT 2026',
    focus: 'Ritmo: ~4 min/questão. Comece pelas específicas se render mais para você; marque e volte nas difíceis.',
    extra: [{ kind: 'revisao', text: 'Prova teórico-objetiva (mínimo de 50% de acertos na SES/SC)' }]
  }
]

function build(s: Spec): SprintDay {
  const items: PlanItem[] = []
  let i = 0
  const id = () => `s30-${s.date}-${i++}`
  if (s.sim) items.push({ id: id(), kind: 'simulado', text: s.sim.text, exam: s.sim.exam, range: s.sim.range })
  if (s.topics?.length && s.n) {
    items.push({ id: id(), kind: 'questoes', text: `${s.n} questões de ${s.topics.map((t) => TOPIC_MAP.get(t)?.short ?? t).join(', ')} — provas FDT primeiro, depois ENARE`, topics: s.topics, n: s.n })
  }
  if (s.teoria?.length) {
    items.push({ id: id(), kind: 'teoria', text: 'Teoria dirigida — só o que a banca cobra', points: s.teoria, refs: s.refs })
  }
  for (const e of s.extra ?? []) items.push({ ...e, id: id() })
  if (s.kind !== 'descanso' && s.kind !== 'prova' && s.kind !== 'simulado') {
    items.push({ id: id(), kind: 'revisao', text: 'Revisão espaçada + flashcards (30 min)', action: 'revisao' })
  }
  if (s.sus === 'q') items.push({ id: id(), kind: 'questoes', text: 'Bloco geral: 10 questões de SUS (manutenção)', action: 'gerais', n: 10 })
  if (s.sus === 'lei') items.push({ id: id(), kind: 'lei', text: 'Bloco geral: 15 min de flashcards de lei seca', action: 'cards' })
  return { date: s.date, kind: s.kind ?? 'estudo', title: s.title, focus: s.focus, items }
}

export const SPRINT_DAYS: SprintDay[] = DAYS.map(build)

/** Ativo na semana anterior ao início (mostra o 1º dia) e até o dia da prova */
export const sprintActive = (today: string) => today >= '2026-10-13' && today <= SPRINT.exam

export function sprintDay(today: string): SprintDay | undefined {
  if (today < SPRINT.start) return SPRINT_DAYS[0]
  return SPRINT_DAYS.find((d) => d.date === today)
}
