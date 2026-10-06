import { useEffect, useState } from 'react'
import { supabase, useAuth } from '../lib/supabase'
import { deleteRemoteAttempts, syncNow, useSyncStatus } from '../lib/sync'
import { DEFAULT_SETTINGS, pendingCount, store, useData, type Data } from '../lib/store'
import { useStudy } from '../lib/study'
import type { Settings } from '../lib/types'
import { EXAMS } from '../data/exams'
import { toast } from '../components/ui'
import { disableReminders, enableReminders, isIOS, isStandalone, pushSupported, sendTestReminder, serverReminder, updateReminderHour } from '../lib/push'

const STATUS_TXT = {
  local: 'Somente neste aparelho',
  offline: 'Sem internet — salvo no aparelho, envia quando voltar',
  syncing: 'Sincronizando…',
  ok: 'Sincronizado',
  error: 'Erro ao sincronizar'
}

function Account() {
  const { user, ready } = useAuth()
  const sync = useSyncStatus()
  const d = useData()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  if (!supabase) {
    return (
      <div className="card">
        <h2>Conta e sincronização</h2>
        <p className="muted">Sincronização desativada nesta instalação (variáveis do Supabase ausentes). Tudo fica salvo neste aparelho.</p>
      </div>
    )
  }
  if (!ready) return <div className="card"><p className="muted">Carregando conta…</p></div>

  if (user) {
    return (
      <div className="card">
        <h2>Conta e sincronização</h2>
        <p className="muted" style={{ marginTop: 0 }}>Conectado como <b>{user.email}</b></p>
        <div className="row" style={{ marginBottom: 10 }}>
          <span className={`sync-dot ${sync.status}`} />
          <span className="muted">{STATUS_TXT[sync.status]}{sync.lastSyncAt ? ` · ${new Date(sync.lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
        </div>
        {sync.status === 'error' && <div className="alert" style={{ marginBottom: 10 }}>{sync.lastError}</div>}
        <p className="faint">{pendingCount(d)} alterações aguardando envio.</p>
        <div className="row wrap">
          <button className="btn primary" onClick={() => syncNow()}>Sincronizar agora</button>
          <button className="btn" onClick={async () => { await syncNow(); await supabase!.auth.signOut(); toast('Você saiu da conta') }}>Sair</button>
        </div>
      </div>
    )
  }

  const run = async (kind: 'in' | 'up' | 'reset') => {
    setBusy(true)
    setMsg('')
    try {
      if (kind === 'in') {
        const { error } = await supabase!.auth.signInWithPassword({ email, password: pass })
        if (error) throw error
        toast('Conectado — sincronizando')
      } else if (kind === 'up') {
        const { data, error } = await supabase!.auth.signUp({ email, password: pass, options: { emailRedirectTo: location.origin } })
        if (error) throw error
        if (data.session) toast('Conta criada e conectada')
        else setMsg('Conta criada! Abra o e-mail de confirmação e toque no link. Depois volte aqui e entre com e-mail e senha.')
      } else {
        const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/#/ajustes' })
        if (error) throw error
        setMsg('Enviamos um link para redefinir a senha.')
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      setMsg(m.includes('Invalid login') ? 'E-mail ou senha incorretos.' : m.includes('Email not confirmed') ? 'Confirme o e-mail pelo link enviado e tente de novo.' : m)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <h2>Conta e sincronização</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Sem conta, tudo fica salvo só neste aparelho. Entre para sincronizar respostas, revisão, anotações e checklist entre celular e computador.
      </p>
      <label className="field"><span>E-mail</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="field"><span>Senha (mín. 6 caracteres)</span><input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} /></label>
      {msg && <div className="alert" style={{ marginBottom: 10 }}>{msg}</div>}
      <div className="grid2">
        <button className="btn primary" disabled={busy || !email || pass.length < 6} onClick={() => run('in')}>Entrar</button>
        <button className="btn" disabled={busy || !email || pass.length < 6} onClick={() => run('up')}>Criar conta</button>
      </div>
      <button className="btn ghost small" style={{ paddingLeft: 0, marginTop: 6 }} disabled={busy || !email} onClick={() => run('reset')}>Esqueci a senha</button>
    </div>
  )
}

function Reminders() {
  const { user } = useAuth()
  const [hour, setHour] = useState<number | null>(null)
  const [pick, setPick] = useState(19)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    serverReminder()
      .then((r) => {
        if (!alive) return
        setHour(r?.hour ?? null)
        if (r) setPick(r.hour)
      })
      .catch(() => undefined)
      .finally(() => alive && setLoaded(true))
    return () => {
      alive = false
    }
  }, [user])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const iosNeedsInstall = isIOS() && !isStandalone()
  return (
    <div className="card">
      <h2>Lembrete diário no celular</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Uma notificação por dia, no horário escolhido, <b>só quando houver revisão pendente</b> (questões da revisão espaçada e flashcards).
      </p>
      {!supabase || !user ? (
        <p className="faint" style={{ margin: 0 }}>Entre na sua conta (acima) para ativar: o aviso sai do servidor mesmo com o app fechado.</p>
      ) : iosNeedsInstall ? (
        <div className="alert">No iPhone/iPad, primeiro instale o app: Safari → Compartilhar → “Adicionar à Tela de Início”. Depois abra pelo ícone e volte aqui (iOS 16.4 ou mais recente).</div>
      ) : !pushSupported() ? (
        <p className="faint" style={{ margin: 0 }}>Este navegador não suporta notificações push. No Android use o Chrome; no computador, Chrome, Edge ou Firefox.</p>
      ) : !loaded ? (
        <p className="faint" style={{ margin: 0 }}>Verificando…</p>
      ) : (
        <>
          <label className="field">
            <span>Horário do lembrete</span>
            <select
              value={pick}
              disabled={busy}
              onChange={(e) => {
                const h = Number(e.target.value)
                setPick(h)
                if (hour !== null) run(async () => { await updateReminderHour(h); setHour(h); toast(`Lembrete às ${h}h`) })
              }}
            >
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </label>
          {hour === null ? (
            <button className="btn primary" disabled={busy} onClick={() => run(async () => { await enableReminders(pick); setHour(pick); toast('Lembretes ativados neste aparelho') })}>
              Ativar lembretes neste aparelho
            </button>
          ) : (
            <div className="row wrap">
              <span className="tag ok">ativo às {String(hour).padStart(2, '0')}:00</span>
              <button className="btn small" disabled={busy} onClick={() => run(async () => { const n = await sendTestReminder(); toast(n ? 'Notificação de teste enviada' : 'Nenhum aparelho inscrito') })}>Enviar teste</button>
              <button className="btn small ghost" disabled={busy} onClick={() => run(async () => { await disableReminders(); setHour(null); toast('Lembretes desativados') })}>Desativar</button>
            </div>
          )}
          <p className="faint" style={{ marginBottom: 0 }}>Ative em cada aparelho onde quiser receber. Se o celular estiver em modo economia de bateria, o aviso pode atrasar alguns minutos.</p>
        </>
      )}
    </div>
  )
}

export function Ajustes() {
  const study = useStudy()
  const s = study.settings
  const set = (patch: Partial<Settings>) => store.setState('settings', 'main', { ...s, ...patch })

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(store.get(), null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `residencia-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importBackup = async (f: File) => {
    try {
      const d = JSON.parse(await f.text()) as Data
      if (!Array.isArray(d.attempts) || typeof d.state !== 'object') throw new Error('arquivo inválido')
      store.importBackup(d)
      toast(`Backup importado: ${d.attempts.length} respostas`)
    } catch (e) {
      toast('Não foi possível importar: ' + (e instanceof Error ? e.message : ''))
    }
  }
  const reset = async () => {
    if (!confirm('Apagar TODAS as suas respostas (inclusive na nuvem)? Favoritos, anotações e checklist do plano são mantidos.')) return
    try {
      await deleteRemoteAttempts()
      store.clearAttempts()
      toast('Respostas apagadas')
    } catch (e) {
      toast('Erro: ' + (e instanceof Error ? e.message : ''))
    }
  }

  return (
    <>
      <Account />
      <Reminders />

      <div className="card">
        <h2>Datas das provas</h2>
        <label className="field">
          <span>FDT/Fundatec — prova teórico-objetiva</span>
          <input type="date" value={s.fdtDate} onChange={(e) => e.target.value && set({ fdtDate: e.target.value })} />
        </label>
        <label className="field">
          <span>ENARE (próxima edição — data estimada, ajuste quando sair o edital)</span>
          <input type="date" value={s.enareDate} onChange={(e) => e.target.value && set({ enareDate: e.target.value })} />
        </label>
        <p className="faint" style={{ margin: 0 }}>O cronograma é recalculado automaticamente. Padrões: FDT {DEFAULT_SETTINGS.fdtDate.split('-').reverse().join('/')} · ENARE {DEFAULT_SETTINGS.enareDate.split('-').reverse().join('/')}.</p>
      </div>

      <div className="card">
        <h2>Preferências</h2>
        <label className="field">
          <span>Meta diária de questões</span>
          <input type="number" min={5} max={200} value={s.dailyGoal} onChange={(e) => set({ dailyGoal: Math.max(1, Number(e.target.value) || 20) })} />
        </label>
        <label className="field"><span>Tema</span></label>
        <div className="chips" style={{ marginTop: -6 }}>
          {(['auto', 'light', 'dark'] as const).map((t) => (
            <button key={t} className="chip" aria-pressed={s.theme === t} onClick={() => set({ theme: t })}>
              {t === 'auto' ? 'Automático' : t === 'light' ? 'Claro' : 'Escuro'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Backup</h2>
        <p className="muted" style={{ marginTop: 0 }}>Exporte um arquivo com todas as respostas e anotações (útil mesmo sem conta).</p>
        <div className="row wrap">
          <button className="btn" onClick={exportBackup}>Exportar</button>
          <label className="btn">
            Importar
            <input type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && importBackup(e.target.files[0])} />
          </label>
          <button className="btn danger" onClick={reset}>Apagar respostas</button>
        </div>
      </div>

      <div className="card">
        <h2>Sobre os gabaritos</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          As resoluções são comentários de estudo, conferidos questão a questão, mas <b>não substituem o gabarito definitivo</b> das bancas. Questões com ⚠️ têm ponto controverso. Os gabaritos definitivos já publicados (FDT 2023–2025) estão aplicados; veja <a href="#/gabaritos">gabaritos oficiais e divergências</a>. Para o ENARE, importe o definitivo quando a FGV publicar.
        </p>
        <ul className="muted" style={{ paddingLeft: 18 }}>
          {EXAMS.map((e) => (
            <li key={e.id}><a href={`/provas/${e.pdf}`} target="_blank" rel="noopener noreferrer">{e.full}</a></li>
          ))}
          <li><a href="/provas/FDT-2026-anexo-I-referencias-bibliograficas.pdf" target="_blank" rel="noopener noreferrer">FDT 2026 — Anexo I (referências bibliográficas)</a></li>
        </ul>
      </div>
    </>
  )
}
