import { Fragment, useEffect, useState, type ReactNode } from 'react'

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const Icon = {
  home: () => (<svg width="22" height="22" viewBox="0 0 24 24" {...P}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></svg>),
  plan: () => (<svg width="22" height="22" viewBox="0 0 24 24" {...P}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M8 14h3M8 17h6" /></svg>),
  quiz: () => (<svg width="22" height="22" viewBox="0 0 24 24" {...P}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>),
  review: () => (<svg width="22" height="22" viewBox="0 0 24 24" {...P}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /><path d="M12 8v4l3 2" /></svg>),
  book: () => (<svg width="22" height="22" viewBox="0 0 24 24" {...P}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /><path d="M9 7h6" /></svg>),
  gear: () => (<svg width="20" height="20" viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>),
  back: () => (<svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M15 18l-6-6 6-6" /></svg>),
  close: () => (<svg width="20" height="20" viewBox="0 0 24 24" {...P}><path d="M18 6L6 18M6 6l12 12" /></svg>),
  star: (on?: boolean) => (<svg width="20" height="20" viewBox="0 0 24 24" {...P} fill={on ? 'currentColor' : 'none'}><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" /></svg>),
  ext: () => (<svg width="14" height="14" viewBox="0 0 24 24" {...P}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>),
  play: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>)
}

export function Bar({ value, tone }: { value: number; tone?: 'auto' | 'plain' }) {
  const v = Math.max(0, Math.min(1, value))
  const cls = tone === 'auto' ? (v < 0.5 ? 'low' : v < 0.7 ? 'mid' : 'high') : ''
  return (
    <div className={`bar ${cls}`} role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${v * 100}%` }} />
    </div>
  )
}

export const pct = (v: number) => `${Math.round(v * 100)}%`

export function accTone(acc: number): 'no' | 'gold' | 'ok' {
  return acc < 0.5 ? 'no' : acc < 0.7 ? 'gold' : 'ok'
}

export function ExtLink({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <>{children}</>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children} <Icon.ext />
    </a>
  )
}

let toastFn: ((m: string) => void) | null = null
export function toast(msg: string) {
  toastFn?.(msg)
}
export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    toastFn = (m) => {
      setMsg(m)
      clearTimeout(t)
      t = setTimeout(() => setMsg(null), 2600)
    }
    return () => {
      toastFn = null
    }
  }, [])
  return msg ? <div className="toast" role="status">{msg}</div> : null
}

/** Renderiza o enunciado preservando listas (I., II., ( ), 1.); a figura entra antes da primeira assertiva */
export function Stem({ text, img, alt }: { text: string; img?: string; alt?: string }) {
  const lines = text.split('\n')
  const isAssert = (ln: string) => /^(\(\s*\)|[IVX]+\.|\d+\.)\s/.test(ln)
  let imgAt = lines.findIndex(isAssert)
  if (imgAt < 0) imgAt = lines.length
  const figure = img ? <img key="img" className="q-img" src={img} alt={alt ?? 'Figura da questão'} loading="lazy" /> : null
  return (
    <div className="q-stem">
      {lines.map((ln, i) => {
        const isAsk = /^(Quais|Qual|Assinale|Está correto|A ordem|As afirmativas são|O resultado)/.test(ln)
        return (
          <Fragment key={i}>
            {i === imgAt && figure}
            <p className={isAssert(ln) ? 'assert' : isAsk ? 'ask' : undefined}>{ln}</p>
          </Fragment>
        )
      })}
      {imgAt === lines.length && figure}
    </div>
  )
}

export function Html({ html, className }: { html: string; className?: string }) {
  // Conteúdo estático do próprio app (comentários das questões); não vem do usuário.
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
