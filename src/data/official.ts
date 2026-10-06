import type { ExamId, Letter } from '../lib/types'

// Gabaritos definitivos publicados pelas bancas.
// '*' = questão anulada (a banca atribuiu o ponto a todos os candidatos).

export interface OfficialKey {
  exam: ExamId
  status: 'definitivo' | 'pendente'
  /** Sequência de respostas, uma letra por questão (índice 0 = questão 1) */
  answers?: string
  source?: string
  pdf?: string
  date?: string
  /** Data prevista de divulgação, quando ainda não saiu */
  expected?: string
  /** Resumo das justificativas da banca para anulações e alterações */
  notes: Record<number, string>
}

const S3 = 'https://concursos-publicacoes.s3.amazonaws.com'

export const OFFICIAL: OfficialKey[] = [
  {
    exam: 'fdt2025',
    status: 'definitivo',
    answers: 'ABC*DDC*BBDB*DCABAC*BB***BDDD**CA*CAC*CDBABBAADACBBACDD*CDAC',
    source: `${S3}/1009/publico/1009_Edital_09-2025_GabaritosDefinitivosdasProvasTO_COMRECURSO_6939eb102d548.pdf`,
    pdf: '/provas/gabaritos/FDT-2025-gabarito-definitivo-e-justificativas.pdf',
    date: '2025-12-10',
    notes: {
      4: 'Anulada: “participar da formulação” não impede dizer que o SUS “formula” — a alternativa B admite dupla interpretação e nenhuma satisfaz o “EXCETO”.',
      8: 'Anulada: a referência fala em “7 dias completos, ou seja, de 0 a 6 dias”; sem esse esclarecimento a definição de mortalidade perinatal ficou imprecisa.',
      13: 'Anulada: a Lei 8.142 é de 1990, não 1991. O correto seria V–F–F–V, combinação que não existe nas alternativas.',
      20: 'Anulada: os conceitos de PNH, EPS e normas do SUS se sobrepõem e permitiam mais de uma associação.',
      23: 'Anulada: a assertiva II deveria dizer “processo coronoide”, não “processo zigomático”; com ela falsa, nenhuma alternativa fecha.',
      24: 'Anulada por não cumprir os regramentos do edital.',
      25: 'Anulada por não cumprir os regramentos do edital.',
      30: 'Anulada: tanto a artroscopia nível III quanto a discopexia reposicionam e fixam o disco.',
      31: 'Anulada por não cumprir os regramentos do edital.',
      34: 'Anulada por não cumprir os regramentos do edital.',
      38: 'Anulada por não cumprir os regramentos do edital.',
      49: 'Gabarito alterado de D para C: segundo Neville, a forma eritematosa (incluindo atrofia papilar central e atrófica aguda) é a candidíase mais comum — a assertiva I, que dá a pseudomembranosa como mais comum, é falsa.',
      56: 'Anulada: a candidíase eritematosa pode lembrar eritroplasia, não leucoplasia, como a assertiva II comparou.'
    }
  },
  {
    exam: 'fdt2024',
    status: 'definitivo',
    answers: 'CABCDBCADBCBBDADCCDACAABADCDBDBCCADBACCBDD*ADDDCCBBBD*ABACAB',
    source: `${S3}/921/publico/Gabaritos_Definitivos_921_674a3ac467249.pdf`,
    pdf: '/provas/gabaritos/FDT-2024-gabarito-definitivo.pdf',
    date: '2024-11-29',
    notes: {
      17: 'Mantida C (I, II e IV): a assertiva III traz o conceito de intrassetorialidade (“desfragmentação das ações ofertadas por um setor”), não de intersetorialidade (articulação de saberes e setores em intervenções compartilhadas).',
      43: 'Anulada: a exposição inadequada ao flúor é fator de risco, mas não “agente causador” de cárie.',
      54: 'Anulada: a alternativa A deveria dizer “indicado” (não “contraindicado”), o que gerou duas respostas corretas.',
      60: 'Mantida B: a mucosite resulta de um processo — espécies reativas de oxigênio, apoptose e cascata inflamatória mediada por citocinas (TNF-α, IL-1β) —, não de destruição direta e imediata do epitélio.'
    }
  },
  {
    exam: 'fdt2023',
    status: 'definitivo',
    answers: 'DB*DCBCDDCACBDBAADABACCBACCBCDBCBAB*ABBDDADDBADACACDDADBCABC',
    source: `${S3}/782/publico/782_Edital_14-2023_Gabaritos_Definitivos_656f72e899cb1.pdf`,
    pdf: '/provas/gabaritos/FDT-2023-gabarito-definitivo.pdf',
    date: '2023-12-07',
    notes: {
      3: 'Anulada (Edital 15/2023, retificação): a assertiva III deveria dizer “durante os anos 1950 e 1960 foram promovidas apenas duas conferências”. O primeiro CNS é de 1937.',
      14: 'Mantida D (V–F–V–V): a falsa é a 2ª — a eMulti Complementar vincula-se a 5–9 equipes; “1 a 4” descreve a Estratégica. As demais (inclusive a de conjunto de municípios) estão na Portaria 635/2023.',
      26: 'Gabarito alterado de D para C (I, II e IV): gestação é contraindicação relativa, mas o enunciado pede condições que “devem ser tratadas antes” — e gestação não se trata (Prado & Salim, p. 146).',
      28: 'Mantida B (I e III): segundo Puricelli (cap. 8), as incisões da cirurgia paraendodôntica localizam-se predominantemente por vestibular.',
      36: 'Anulada: as alternativas A e B também estavam corretas segundo Malamed.',
      40: 'Mantida D (I, II e III): Prado & Salim (p. 614) listam o hematoma intraocular, diplopia, oftalmoplegia, epistaxe e parestesia do infraorbitário entre os sinais da fratura de zigoma.'
    }
  },
  {
    exam: 'enare2026',
    status: 'pendente',
    expected: '2026-10-13',
    source: 'https://enare2026.conhecimento.fgv.br/provas/',
    notes: {}
  }
]

/** Gabarito definitivo da FDT 2022 (PSU/RUMS 2022, processo 676) — pronto para quando a prova for adicionada */
export const FDT2022_KEY = {
  answers: 'DCADADDCABCDCABABDABADBDCCADBCAAACDBBBDAADCCADDCCCCBBBBDDBDC',
  source: `${S3}/676/publico/Edital_Gabaritos_Defintivos_676_63978273545ed.pdf`,
  pdf: '/provas/gabaritos/FDT-2022-gabarito-definitivo.pdf'
}

export const OFFICIAL_MAP = new Map(OFFICIAL.map((o) => [o.exam, o]))

/** Lê uma sequência colada pelo usuário: "1-C 2-A ...", "1) C", "CAEEB..." ou uma letra por linha. '*', 'X' ou 'N' = anulada. */
export function parseKey(text: string, n: number): string | null {
  const t = text.toUpperCase()
  const pairs = [...t.matchAll(/(\d{1,3})\s*[-–.):=]?\s*([A-E*XN])\b/g)]
  const out = Array.from({ length: n }, () => '?')
  if (pairs.length >= Math.min(n, 5)) {
    for (const [, num, l] of pairs) {
      const i = Number(num) - 1
      if (i >= 0 && i < n) out[i] = l === 'X' || l === 'N' ? '*' : l
    }
  } else {
    const letters = t.replace(/[^A-E*XN]/g, '').replace(/[XN]/g, '*')
    if (letters.length !== n) return null
    return letters
  }
  return out.includes('?') ? null : out.join('')
}

export type OfficialAnswer = Letter | '*'
