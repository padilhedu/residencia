# 🦷 Residência Odonto — ENARE & FDT/Fundatec

App de estudos (PWA) para as provas de **residência multiprofissional em Odontologia**:
**FDT/Fundatec 2026** (prova em 22/11/2026) e **ENARE** (FGV/Ebserh — próxima edição, data estimada em 12/09/2027, ajustável no app).

Funciona no celular como app instalado e **sem internet**. Com login, o progresso sincroniza com o Supabase entre celular e computador.

## O que tem no app

| Aba | O que faz |
|-----|-----------|
| **Hoje** | Contagem regressiva das provas, fila de revisão do dia, meta diária, tarefas da semana, temas mais fracos e teoria a revisar |
| **Plano** | Cronograma semana a semana: o que **ler** (bibliografia do edital com links), o que **assistir** (buscas de aulas), questões, lei seca e simulados, com checklist |
| **Questões** | Aba só de resolução: 280 questões comentadas (ENARE 2026/27, FDT 2025, 2024 e 2023), filtros por prova/bloco/tema/situação, modo treino (comentário na hora) e simulado cronometrado |
| **Revisão** | Revisão espaçada guiada pelo % de acerto, temas críticos, desempenho por prova/área/tema e tipo de erro |
| **Conteúdo** | Conteúdo programático por tema (33 temas), bibliografia oficial, aulas sugeridas e incidência em cada banca |

### Revisão espaçada (prioriza os menores % de acerto)

1. Errou ou marcou “chutei” → a questão volta em **1 dia**, depois **3, 7, 15, 30 e 60 dias** a cada acerto. Errou de novo → volta para 1 dia.
2. Os intervalos **encolhem nos temas com menor acerto** (×0,5 abaixo de 50%; ×0,75 abaixo de 70%) e esticam acima de 85%.
3. Acertou de primeira num tema fraco (< 70%) → reaparece em 15 dias para confirmar.
4. A fila do dia começa pelo tema mais fraco; o botão **Reforço** monta sessões com questões inéditas e erradas dos 3 piores temas.
5. Teoria: “Revisei a teoria” agenda a próxima leitura do tema em 3/7/14/30 dias conforme o acerto.

A lógica está em [`src/lib/srs.ts`](src/lib/srs.ts) e é coberta por testes (`npm test`).

### Sobre os gabaritos

As resoluções são **comentários de estudo**, não o gabarito oficial. Questões marcadas com ⚠️ têm ponto controverso. Se o gabarito definitivo da banca divergir, use **“O gabarito oficial é outro?”** na própria questão: a correção e a revisão passam a usar a letra oficial.

## Estrutura

```
src/
  data/questions/*.json   banco de questões (enunciado, alternativas, gabarito, comentário, tema)
  data/topics.ts          conteúdo programático, bibliografia do edital, aulas
  data/plan.ts            cronograma (fase FDT + fase ENARE), recalculado pelas datas
  lib/srs.ts              revisão espaçada + estatísticas por tema
  lib/store.ts            armazenamento offline (localStorage)
  lib/sync.ts             sincronização com o Supabase
  pages/                  Hoje, Plano, Questões, Revisão, Conteúdo, Sessão, Ajustes
public/provas/            PDFs originais das provas e do Anexo I do edital
supabase/migrations/      schema do banco (tabelas attempts e user_state com RLS)
materiais/                material original (central de estudos, gabarito FDT 2025, plano, checklist)
```

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173
npm test                     # testes da revisão espaçada e do cronograma
npm run build                # gera dist/ (com service worker para uso offline)
```

Sem as variáveis do Supabase o app funciona normalmente, salvando só no aparelho.

## Infraestrutura

- **Supabase** — projeto `residencia-odonto` (região São Paulo). Tabelas `attempts` (cada resposta) e `user_state` (favoritos, anotações, checklist, ajustes, correções de gabarito), com RLS: cada usuário só lê e grava os próprios dados.
- **Vercel** — build `npm run build`, saída `dist/`, variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave publicável).

### Passo único no painel do Supabase

Em **Authentication → URL Configuration**, defina o **Site URL** como o endereço do app na Vercel e inclua-o em **Redirect URLs**. Assim os links de confirmação de cadastro e de troca de senha abrem o app (sem isso eles abrem `localhost`; a conta é confirmada mesmo assim, basta voltar ao app e entrar com e-mail e senha).

## Como adicionar uma prova nova

1. Gere `src/data/questions/<id>.json` no mesmo formato (`id`, `exam`, `n`, `block`, `topic`, `stem`, `opts`, `answer`, `ex`).
2. Registre a prova em `src/data/exams.ts` (`EXAMS` e `QUESTIONS`) e o PDF em `public/provas/`.
3. `npm test && npm run build`, commit e push — a Vercel publica sozinha.
