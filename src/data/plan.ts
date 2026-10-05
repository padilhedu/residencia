import type { ExamId, PlanItem, PlanWeek } from '../lib/types'
import { TOPIC_MAP, ytSearch } from './topics'
import { addDays, mondayOf, toISO, parseISO } from '../lib/dates'

interface WeekTemplate {
  id: string
  title: string
  focus: string
  /** Temas com leitura + aula completas */
  main: string[]
  /** Temas só com questões/revisão rápida */
  extra?: string[]
  simulado?: { exam: ExamId; text: string }
  laws?: { text: string; url: string }[]
  notes?: string[]
}

export const WEEKLY_ROUTINE: { day: string; task: string }[] = [
  { day: 'Seg', task: 'Tema de SUS (lei seca ou política) + 10–15 questões' },
  { day: 'Ter', task: 'Tema específico de Odonto + 10–15 questões' },
  { day: 'Qua', task: 'Fila de revisão espaçada + refazer os erros de seg/ter' },
  { day: 'Qui', task: 'Tema específico de Odonto + questões' },
  { day: 'Sex', task: 'Revisão espaçada + reforço nos temas mais fracos' },
  { day: 'Sáb', task: 'Simulado (parcial ou completo, cronometrado) ou folga' },
  { day: 'Dom', task: 'Fechar a semana: checklist do plano, revisar anotações' }
]

// ───────────── Fase 1: reta final FDT/Fundatec (prova teórico-objetiva) ─────────────
const FDT_TEMPLATES: WeekTemplate[] = [
  {
    id: 'fdt-1', title: 'Base legal do SUS + Cirurgia oral', focus: 'Lei seca e o bloco cirúrgico, que somam ~1/3 da prova FDT.',
    main: ['sus-leg', 'cir'], extra: ['anato'],
    laws: [
      { text: 'Lei seca: CF/88 arts. 196–200', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
      { text: 'Lei seca: Lei 8.080/1990 (arts. 1º–19 e 14-A/B)', url: 'http://www.planalto.gov.br/ccivil_03/leis/L8080.htm' }
    ],
    simulado: { exam: 'fdt2024', text: 'Simulado diagnóstico: FDT 2024 completa (60 questões, 4 h)' }
  },
  {
    id: 'fdt-2', title: 'APS, PNH e Trauma de face', focus: 'PNAB/eMulti/território e a PNH são os temas gerais mais frequentes; CTBMF é o maior bloco específico.',
    main: ['sus-aps', 'sus-pnh', 'ctbmf'],
    laws: [{ text: 'Lei seca: Lei 8.142/1990 e Decreto 7.508/2011', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/decreto/d7508.htm' }]
  },
  {
    id: 'fdt-3', title: 'RAS e Gestão + Anestesia e Emergências', focus: 'Redes, planejamento e controle social; Malamed (anestesia e emergências).',
    main: ['sus-ras', 'anest', 'emerg'], extra: ['sus-gestao', 'farmaco'],
    laws: [{ text: 'Lei seca: LC 141/2012 (arts. 2º–4º, 21)', url: 'http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp141.htm' }],
    simulado: { exam: 'fdt2023', text: 'Simulado: FDT 2023 completa (60 questões, 4 h)' }
  },
  {
    id: 'fdt-4', title: 'Políticas e Vigilância + Estomatologia e Patologia', focus: 'Políticas novas do edital 2026 (PopRua, equidade, segurança do paciente) e Neville.',
    main: ['sus-pol', 'estomato', 'pato'], extra: ['sus-vig', 'sus-seg']
  },
  {
    id: 'fdt-5', title: 'EPS/EIP e Bioética + Cariologia, Endo e Trauma dental', focus: 'Fluoretos (Guia 2026), Maltz, Estrela & Bueno e IADT.',
    main: ['sus-eip', 'cario', 'endo'], extra: ['sus-etica', 'sus-hist', 'trauma'],
    simulado: { exam: 'fdt2025', text: 'Simulado: FDT 2025 completa (60 questões, 4 h)' }
  },
  {
    id: 'fdt-6', title: 'Saúde bucal coletiva, ATM, Perio e Pacientes especiais', focus: 'Lei 14.572/2023, SB Brasil, CEO; Okeson/Stevão; diretriz de periodontite 2025; resoluções CFO 2026.',
    main: ['sb-col', 'dtm', 'especiais'], extra: ['perio', 'hospitalar', 'etica-odonto', 'infec']
  },
  {
    id: 'fdt-7', title: 'Reta final FDT', focus: 'Só revisão: temas críticos do app, leis secas e descanso antes da prova.',
    main: [], extra: [],
    notes: [
      'Seg–Qua: zere a fila de revisão e faça 2 sessões de reforço nos temas mais fracos',
      'Qui: releia as leis secas (CF 196–200, 8.080, 8.142, 7.508) e a PNH',
      'Sex: refaça só as questões que você errou mais de uma vez',
      'Sáb: descanso, separar documento e caneta transparente',
      'Dom: PROVA FDT — 4 h para 60 questões (≈ 4 min/questão)'
    ]
  }
]

// ───────────── Fase 2: ENARE (FGV) — base, aprofundamento, reta final ─────────────
const ENARE_BASE: WeekTemplate[] = [
  { id: 'en-b1', title: 'Legislação do SUS + Estomatologia I', focus: 'Lesões potencialmente malignas, CEC, biópsia.', main: ['sus-leg', 'estomato'] },
  { id: 'en-b2', title: 'História e Políticas + Estomatologia II', focus: 'Infecções, doenças imunomediadas e lesões reacionais.', main: ['sus-hist', 'estomato'], extra: ['sus-pol'] },
  { id: 'en-b3', title: 'RAS + Cistos e tumores', focus: 'Neville: cistos e tumores odontogênicos.', main: ['sus-ras', 'pato'] },
  { id: 'en-b4', title: 'APS + Saúde bucal coletiva', focus: 'PNAB, eMulti, Brasil Sorridente, CEO, SB Brasil.', main: ['sus-aps', 'sb-col'] },
  { id: 'en-b5', title: 'PNH + Pacientes especiais', focus: 'Hipertensão (ESC 2024), endocardite (ESC 2023), coagulopatias, ONM.', main: ['sus-pnh', 'especiais'] },
  { id: 'en-b6', title: 'Segurança do paciente + Biossegurança', focus: 'PNSP, NR-32, RDC 1002/2025, Spaulding.', main: ['sus-seg', 'biosseg'] },
  { id: 'en-b7', title: 'Vigilância + Farmacologia', focus: 'PNVS, indicadores; analgésicos, antibióticos e profilaxia.', main: ['sus-vig', 'farmaco'] },
  { id: 'en-b8', title: 'EPS/EIP + Anestesia local', focus: 'Malamed 7ª ed.', main: ['sus-eip', 'anest'] },
  { id: 'en-b9', title: 'Gestão + Emergências médicas', focus: 'Planejamento/controle social; Malamed emergências.', main: ['sus-gestao', 'emerg'] },
  { id: 'en-b10', title: 'Direitos e Bioética + Ética odontológica', focus: 'Código de Ética (direitos, deveres, prontuário, consentimento).', main: ['sus-etica', 'etica-odonto'] },
  { id: 'en-b11', title: 'Cirurgia oral + Infecções', focus: 'Retalhos, instrumental, cicatrização, espaços fasciais.', main: ['cir', 'infec'] },
  { id: 'en-b12', title: 'Trauma de face + Anatomia', focus: 'Le Fort, órbita, via aérea; nervos e vasos.', main: ['ctbmf', 'anato'] },
  { id: 'en-b13', title: 'Periodontia + Endodontia', focus: 'Classificação 2018, peri-implantite, antibióticos (EFP).', main: ['perio', 'endo'] },
  { id: 'en-b14', title: 'Cariologia + Odontopediatria', focus: 'Fluoretos, dieta, Nyvad, HMI.', main: ['cario', 'odontoped'] },
  { id: 'en-b15', title: 'Radiologia + ATM', focus: 'TC/TCFC, Hounsfield; DTM e anquilose.', main: ['radio', 'dtm'] },
  { id: 'en-b16', title: 'Hospitalar, Idoso e Trauma dental', focus: 'Mucosite, osteorradionecrose, hipossalivação, IADT.', main: ['hospitalar', 'geriatria'], extra: ['trauma'] }
]

const ENARE_DEEP: WeekTemplate[] = [
  { id: 'en-d1', title: 'Aprofundamento: SUS (leis + RAS + APS)', focus: 'Questões estilo FGV: caso → conduta coerente com a política.', main: [], extra: ['sus-leg', 'sus-ras', 'sus-aps'], simulado: { exam: 'enare2026', text: 'Simulado ENARE 2026 — bloco geral (questões 1–20)' } },
  { id: 'en-d2', title: 'Aprofundamento: Estomatologia + Patologia', focus: 'Casos clínicos com diagnóstico diferencial.', main: [], extra: ['estomato', 'pato'] },
  { id: 'en-d3', title: 'Aprofundamento: Pac. especiais + Farmacologia', focus: 'Diretrizes ESC, profilaxia, ONM.', main: [], extra: ['especiais', 'farmaco', 'hospitalar'] },
  { id: 'en-d4', title: 'Aprofundamento: Cirurgia + Infecções + CTBMF', focus: 'Fluxograma de conduta e anatomia aplicada.', main: [], extra: ['cir', 'infec', 'ctbmf', 'anato'], simulado: { exam: 'enare2026', text: 'Simulado ENARE 2026 completo (100 questões, 5 h)' } },
  { id: 'en-d5', title: 'Aprofundamento: Anestesia + Emergências', focus: 'Doses, toxicidade, kit de emergência.', main: [], extra: ['anest', 'emerg'] },
  { id: 'en-d6', title: 'Aprofundamento: Perio, Cário, Endo', focus: 'Diretrizes MS 2025 e guia de fluoretos.', main: [], extra: ['perio', 'cario', 'endo'] },
  { id: 'en-d7', title: 'Aprofundamento: Saúde bucal coletiva, Biossegurança, Ética', focus: 'Rede de saúde bucal, RDC, CEO.', main: [], extra: ['sb-col', 'biosseg', 'etica-odonto'] },
  { id: 'en-d8', title: 'Aprofundamento: PNH, Políticas, Vigilância, Segurança', focus: 'Políticas transversais e segurança do paciente.', main: [], extra: ['sus-pnh', 'sus-pol', 'sus-vig', 'sus-seg'], simulado: { exam: 'fdt2025', text: 'Simulado extra: FDT 2025 (treina leitura de enunciados longos)' } }
]

const ENARE_FINAL: WeekTemplate[] = [
  { id: 'en-f1', title: 'Reta final ENARE I', focus: 'Simulado completo + correção por tema.', main: [], simulado: { exam: 'enare2026', text: 'Simulado ENARE completo (100 questões, 5 h) — refazer cronometrado' }, notes: ['Corrija o simulado e marque o tipo de cada erro (conteúdo, interpretação, desatenção)'] },
  { id: 'en-f2', title: 'Reta final ENARE II', focus: 'Temas críticos + leis secas.', main: [], notes: ['2 sessões de reforço nos 3 temas mais fracos', 'Leis secas: CF 196–200, 8.080, 8.142, 7.508'] },
  { id: 'en-f3', title: 'Reta final ENARE III', focus: 'Só questões erradas e anotações.', main: [], notes: ['Refazer todas as questões marcadas com ★', 'Revisar o tipo de erro mais frequente'] },
  { id: 'en-f4', title: 'Semana da prova ENARE', focus: 'Revisão leve e descanso.', main: [], notes: ['Zere a fila de revisão até quarta', 'Véspera: descanso e logística', 'Prova: 5 h para 100 questões (3 min/questão)'] }
]

const REFORCO = (i: number): WeekTemplate => ({
  id: `en-r${i}`, title: `Reforço dirigido ${i}`, focus: 'O app escolhe os temas: os 3 com menor % de acerto no momento.', main: [],
  notes: ['Aula + leitura do tema mais fraco (veja em Revisão → Temas críticos)', '3 sessões de reforço de 15 questões', 'Zere a fila de revisão diariamente']
})

const LIGHT = (key: string): WeekTemplate => ({
  id: `en-light-${key}`, title: 'Semana leve (festas)', focus: 'Mantenha o ritmo mínimo: revisão espaçada e um mini-simulado.', main: [],
  notes: ['15 min/dia de revisão espaçada', '1 sessão de 20 questões mistas']
})

function itemsFor(t: WeekTemplate): PlanItem[] {
  const items: PlanItem[] = []
  for (const tid of t.main) {
    const topic = TOPIC_MAP.get(tid)
    if (!topic) continue
    const ref = topic.refs[0]
    if (ref) items.push({ id: `${t.id}-ler-${tid}`, kind: 'ler', text: `Ler: ${ref.t}`, url: ref.url, topics: [tid] })
    if (topic.refs[1]) items.push({ id: `${t.id}-ler2-${tid}`, kind: 'ler', text: `Ler: ${topic.refs[1].t}`, url: topic.refs[1].url, topics: [tid] })
    items.push({ id: `${t.id}-aula-${tid}`, kind: 'assistir', text: `Aula: ${topic.videos[0]}`, url: ytSearch(topic.videos[0]), topics: [tid] })
  }
  for (const l of t.laws ?? []) items.push({ id: `${t.id}-lei-${items.length}`, kind: 'lei', text: l.text, url: l.url })
  const qTopics = [...t.main, ...(t.extra ?? [])]
  if (qTopics.length) {
    items.push({ id: `${t.id}-q`, kind: 'questoes', text: `Questões: ${qTopics.map((id) => TOPIC_MAP.get(id)?.short ?? id).join(', ')}`, topics: qTopics })
  }
  for (const [i, n] of (t.notes ?? []).entries()) items.push({ id: `${t.id}-n${i}`, kind: 'revisao', text: n })
  items.push({ id: `${t.id}-rev`, kind: 'revisao', text: 'Revisão espaçada: zerar a fila do app (15–20 min/dia)' })
  if (t.simulado) items.push({ id: `${t.id}-sim`, kind: 'simulado', text: t.simulado.text, exam: t.simulado.exam })
  return items
}

function toWeek(t: WeekTemplate, phase: 'fdt' | 'enare', start: Date, end?: Date): PlanWeek {
  return {
    id: t.id, phase, title: t.title, focus: t.focus,
    start: toISO(start), end: toISO(end ?? addDays(start, 6)),
    topics: [...t.main, ...(t.extra ?? [])],
    items: itemsFor(t)
  }
}

function weeksBetween(startMonday: Date, lastDay: Date): Date[] {
  const out: Date[] = []
  for (let d = startMonday; d <= lastDay; d = addDays(d, 7)) out.push(d)
  return out
}

function chunk<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n)
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function merge(ts: WeekTemplate[]): WeekTemplate {
  if (ts.length === 1) return ts[0]
  return {
    id: ts.map((t) => t.id).join('+'),
    title: ts.map((t) => t.title).join(' · '),
    focus: ts.map((t) => t.focus).join(' '),
    main: ts.flatMap((t) => t.main),
    extra: ts.flatMap((t) => t.extra ?? []),
    simulado: ts.find((t) => t.simulado)?.simulado,
    notes: ts.flatMap((t) => t.notes ?? [])
  }
}

const isHoliday = (monday: Date) => {
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i)
    if ((d.getMonth() === 11 && d.getDate() === 25) || (d.getMonth() === 0 && d.getDate() === 1)) return true
  }
  return false
}

export function buildPlan(planStart: string, fdtDate: string, enareDate: string): PlanWeek[] {
  const weeks: PlanWeek[] = []
  const fdt = parseISO(fdtDate)
  const enare = parseISO(enareDate)

  // Fase FDT
  const fdtMondays = weeksBetween(mondayOf(parseISO(planStart)), fdt)
  if (fdtMondays.length > 0) {
    const n = fdtMondays.length
    let ts: WeekTemplate[]
    const body = FDT_TEMPLATES.slice(0, -1)
    const final = FDT_TEMPLATES[FDT_TEMPLATES.length - 1]
    if (n >= FDT_TEMPLATES.length) {
      const extra = Array.from({ length: n - FDT_TEMPLATES.length }, (_, i) => ({ ...REFORCO(i + 1), id: `fdt-r${i + 1}` }))
      ts = [...body, ...extra, final]
    } else if (n === 1) {
      ts = [final]
    } else {
      ts = [...chunk(body, n - 1).map(merge), final]
    }
    ts.forEach((t, i) => weeks.push(toWeek(t, 'fdt', fdtMondays[i], i === ts.length - 1 ? fdt : undefined)))
  }

  // Fase ENARE
  const enStart = fdtMondays.length ? addDays(mondayOf(fdt), 7) : mondayOf(parseISO(planStart))
  const enMondays = weeksBetween(enStart, enare)
  if (enMondays.length > 0) {
    const N = enMondays.length
    const finalN = Math.min(ENARE_FINAL.length, N)
    const holidays = enMondays.slice(0, N - finalN).filter(isHoliday)
    const R = N - finalN - holidays.length
    let body: WeekTemplate[]
    if (R <= 0) body = []
    else if (R < ENARE_BASE.length) body = chunk(ENARE_BASE, R).map(merge)
    else if (R < ENARE_BASE.length + ENARE_DEEP.length) body = [...ENARE_BASE, ...ENARE_DEEP.slice(0, R - ENARE_BASE.length)]
    else {
      const nRef = R - ENARE_BASE.length - ENARE_DEEP.length
      body = [...ENARE_BASE, ...ENARE_DEEP, ...Array.from({ length: nRef }, (_, i) => REFORCO(i + 1))]
    }
    const final = ENARE_FINAL.slice(ENARE_FINAL.length - finalN)
    let bi = 0
    let fi = 0
    enMondays.forEach((monday, i) => {
      const isLast = i === N - 1
      if (i >= N - finalN) {
        weeks.push(toWeek(final[fi++], 'enare', monday, isLast ? enare : undefined))
      } else if (isHoliday(monday)) {
        weeks.push(toWeek(LIGHT(toISO(monday)), 'enare', monday))
      } else if (bi < body.length) {
        weeks.push(toWeek(body[bi++], 'enare', monday))
      }
    })
  }
  return weeks
}

export function currentWeek(weeks: PlanWeek[], today: string): PlanWeek | undefined {
  return weeks.find((w) => w.start <= today && today <= w.end) ?? weeks.find((w) => w.start > today)
}
