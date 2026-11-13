import { describe, expect, it } from 'vitest'
import { classify, dedupe, extractDeadline, parseLinks, parsePci, parseRss, toItem, type Raw } from './parse'

const ref = new Date('2026-11-13T12:00:00Z')
const raw = (titulo: string, texto?: string, extra: Partial<Raw> = {}): Raw => ({ titulo, texto, url: 'https://x.com/' + encodeURIComponent(titulo), fonte: 'teste', ...extra })

describe('classificação', () => {
  it('concurso de dentista em SC', () => {
    expect(classify(raw('Prefeitura de Joinville - SC abre concurso para Cirurgião-Dentista'))?.categoria).toBe('sc')
    expect(classify(raw('Prefeitura de Lages', 'Vagas para odontólogo ESF'))).toEqual({ categoria: 'sc', uf: 'SC' })
    expect(classify(raw('Concurso Santa Catarina: dentista 40h'))?.categoria).toBe('sc')
  })
  it('dentista fora de SC é descartado (concursos só de SC)', () => {
    expect(classify(raw('Prefeitura de Curitiba - PR abre vagas para dentista'))).toBeNull()
  })
  it('ENARE e residências em qualquer estado', () => {
    expect(classify(raw('ENARE 2027/2028: edital publicado'))?.categoria).toBe('enare')
    expect(classify(raw('Residência em Cirurgia Bucomaxilofacial - HC/UFPR - PR'))).toEqual({ categoria: 'residencia', uf: 'PR' })
    expect(classify(raw('Residência Multiprofissional em Saúde da Família 2027 - inscrições abertas'))?.categoria).toBe('residencia')
    expect(classify(raw('Residência médica em pediatria'))).toBeNull()
  })
  it('descarta auxiliar/técnico em saúde bucal e resultados', () => {
    expect(classify(raw('Prefeitura de Itajaí - SC: concurso para Auxiliar de Saúde Bucal'))).toBeNull()
    expect(classify(raw('Prefeitura de Itajaí - SC: vagas para Cirurgião-Dentista e Auxiliar de Saúde Bucal'))?.categoria).toBe('sc')
    expect(classify(raw('Resultado final do concurso de dentista de Blumenau - SC'))).toBeNull()
  })
  it('fonte dedicada ao ENARE classifica o edital mesmo sem a palavra no texto', () => {
    expect(classify(raw('Edital de abertura - Residência em Área Profissional da Saúde', undefined, { hint: 'enare' }))?.categoria).toBe('enare')
  })
})

describe('prazo de inscrição', () => {
  it('formatos comuns', () => {
    expect(extractDeadline('Inscrições até 05/12/2026', ref)).toBe('2026-12-05')
    expect(extractDeadline('as inscrições vão até 5 de dezembro', ref)).toBe('2026-12-05')
    expect(extractDeadline('Inscrições de 10/11 a 12/01', ref)).toBe('2027-01-12')
    expect(extractDeadline('inscrições encerram em 20 de janeiro de 2027', ref)).toBe('2027-01-20')
    expect(extractDeadline('sem data', ref)).toBeNull()
  })
})

describe('PCI Concursos', () => {
  const html = `<div id="concursos">
  <div class="na" data-url="https://www.pciconcursos.com.br/noticias/prefeitura-de-chapeco-sc-abre-concurso"><div class="ca"><a href="https://www.pciconcursos.com.br/noticias/prefeitura-de-chapeco-sc-abre-concurso" title="Prefeitura de Chapecó - SC">Prefeitura de Chapec&oacute; - SC</a></div><div class="cc">SC</div><div class="cd">35 vagas at&eacute; R$ 12.300,00<br><span>Cirurgi&atilde;o Dentista, Enfermeiro, M&eacute;dico e outros</span><br><span>Superior</span></div><div class="ce"><span>08/12/2026</span></div></div>
  <div class="na"><div class="ca"><a href="https://www.pciconcursos.com.br/noticias/camara-de-tubarao" title="x">C&acirc;mara de Tubar&atilde;o - SC</a></div><div class="cc">SC</div><div class="cd">2 vagas<br><span>Contador, Advogado</span></div><div class="ce"><span>01/12/2026</span></div></div>
  <div class="da"><div class="ca"><a href="https://www.pciconcursos.com.br/noticias/hu-ufpr-residencia">HU-UFPR</a></div><div class="cc">PR</div><div class="cd">40 vagas<br><span>Residência Multiprofissional (Odontologia)</span></div><div class="ce"><span>20/12</span></div></div>
  </div>`
  it('extrai e filtra', () => {
    const r = parsePci(html)
    expect(r).toHaveLength(3)
    expect(r[0]).toMatchObject({ titulo: 'Prefeitura de Chapecó - SC', uf: 'SC', data: '08/12/2026' })
    const items = r.map((x) => toItem(x, ref)).filter(Boolean)
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ categoria: 'sc', vagas: '35 vagas', salario: 'R$ 12.300,00', inscricoes_ate: '2026-12-08', orgao: 'Prefeitura de Chapecó' })
    expect(items[1]).toMatchObject({ categoria: 'residencia', uf: 'PR', inscricoes_ate: '2026-12-20' })
  })
})

describe('RSS (Google Notícias)', () => {
  const xml = `<?xml version="1.0"?><rss><channel><title>x</title>
  <item><title>Concurso Prefeitura de Palhoça SC: vagas para dentista; inscrições até 10/12 - JC Concursos</title><link>https://news.google.com/rss/articles/abc?oc=5</link><pubDate>Tue, 10 Nov 2026 13:00:00 GMT</pubDate><description>&lt;a href="x"&gt;Concurso Prefeitura de Palhoça SC&lt;/a&gt;</description><source url="https://jcconcursos.com.br">JC Concursos</source></item>
  <item><title>Concurso Prefeitura de Palhoça SC: vagas para dentista; inscrições até 10/12 - Folha Dirigida</title><link>https://news.google.com/rss/articles/def</link><source url="https://folha.qconcursos.com">Folha Dirigida</source></item>
  <item><title><![CDATA[ENARE 2027/28: Ebserh divulga edital]]></title><link>https://news.google.com/rss/articles/ghi</link></item>
  </channel></rss>`
  it('extrai, classifica e junta manchetes repetidas', () => {
    const r = parseRss(xml, 'Google Notícias')
    expect(r[0]).toMatchObject({ fonte: 'JC Concursos (via Google Notícias)', publicado_em: '2026-11-10T13:00:00.000Z' })
    expect(r[0].titulo).not.toMatch(/JC Concursos$/)
    const items = dedupe(r.map((x) => toItem(x, ref)!).filter(Boolean))
    expect(items.map((i) => i.categoria)).toEqual(['sc', 'enare'])
    expect(items[0].inscricoes_ate).toBe('2026-12-10')
    expect(items[0].url).toBe('https://news.google.com/rss/articles/abc')
  })
})

describe('links de página', () => {
  it('pega links relevantes com URL absoluta', () => {
    const html = `<a href="/edital-enare.pdf">Edital de abertura do processo seletivo</a><a href="/contato">Fale conosco agora mesmo</a>`
    const r = parseLinks(html, 'https://www.gov.br/ebserh/enare', 'Ebserh', 'enare')
    expect(r).toEqual([{ titulo: 'Edital de abertura do processo seletivo', url: 'https://www.gov.br/edital-enare.pdf', fonte: 'Ebserh', hint: 'enare' }])
  })
  it('usa o texto logo após o link (cargos) para decidir e classificar', () => {
    const html = `<nav><a href="/sc">Concursos em Santa Catarina</a></nav>
      <div class="item"><h3><a href="/c/rancho-queimado">Prefeitura de Rancho Queimado</a></h3><p>Cargos: Cirurgião-Dentista, Enfermeiro. Inscrições até 05/12/2026.</p></div>
      <div class="item"><h3><a href="/c/tubarao">Câmara Municipal de Tubarão</a></h3><p>Cargos: Contador. Inscrições até 01/12.</p></div>`
    const r = parseLinks(html, 'https://site.com/concursos/sc', 'Site')
    expect(r.map((x) => x.url)).toEqual(['https://site.com/c/rancho-queimado'])
    const it = toItem({ ...r[0], uf: 'SC' }, ref)
    expect(it).toMatchObject({ categoria: 'sc', inscricoes_ate: '2026-12-05', orgao: 'Prefeitura de Rancho Queimado' })
  })
  it('página de cargo (só dentista) aceita o órgão sem a palavra dentista', () => {
    expect(classify(raw('Prefeitura de Lages - SC', '2 vagas', { dentista: true }))?.categoria).toBe('sc')
    expect(classify(raw('Prefeitura de Lages - SC', '2 vagas'))).toBeNull()
  })
})
