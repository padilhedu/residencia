// Datas "de calendário" no fuso local, representadas como YYYY-MM-DD.

export const DAY = 86_400_000

export function parseISO(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function mondayOf(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (r.getDay() + 6) % 7
  return addDays(r, -dow)
}

export const todayISO = () => toISO(new Date())

/** Dias de calendário de `from` até `to` (positivo se `to` é futuro) */
export function daysUntil(to: string, from = todayISO()): number {
  return Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / DAY)
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function fmtShort(iso: string): string {
  const d = parseISO(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

export function fmtLong(iso: string): string {
  const d = parseISO(iso)
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

export function fmtRange(a: string, b: string): string {
  return `${fmtShort(a)} – ${fmtShort(b)}`
}

export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}

export function relDays(n: number): string {
  if (n <= 0) return 'hoje'
  if (n === 1) return 'amanhã'
  return `em ${n} dias`
}
