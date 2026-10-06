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
| **Gabaritos** (`#/gabaritos`) | Gabaritos definitivos das bancas, questões anuladas e onde a banca diverge da resolução de estudo; importador para o ENARE |
| **Flashcards** (`#/cards`) | Cartões automáticos das questões que você errou + baralho de lei seca (CF, 8.080, 8.142, 7.508, LC 141, PNAB, saúde bucal, exercício profissional), com revisão espaçada própria |

Também: **tempo médio por questão em cada tema** (Revisão), comparado ao ritmo das provas (ENARE 3 min/questão; FDT 4 min/questão), e **lembrete diário no celular** (Ajustes) quando houver revisão pendente.

### Revisão espaçada (prioriza os menores % de acerto)

1. Errou ou marcou “chutei” → a questão volta em **1 dia**, depois **3, 7, 15, 30 e 60 dias** a cada acerto. Errou de novo → volta para 1 dia.
2. Os intervalos **encolhem nos temas com menor acerto** (×0,5 abaixo de 50%; ×0,75 abaixo de 70%) e esticam acima de 85%.
3. Acertou de primeira num tema fraco (< 70%) → reaparece em 15 dias para confirmar.
4. A fila do dia começa pelo tema mais fraco; o botão **Reforço** monta sessões com questões inéditas e erradas dos 3 piores temas.
5. Teoria: “Revisei a teoria” agenda a próxima leitura do tema em 3/7/14/30 dias conforme o acerto.

A lógica está em [`src/lib/srs.ts`](src/lib/srs.ts) e é coberta por testes (`npm test`).

### Gabaritos oficiais

Os gabaritos **definitivos** da Fundatec (FDT 2023, 2024 e 2025, com as justificativas de anulação/alteração) estão em [`src/data/official.ts`](src/data/official.ts) e os documentos em `public/provas/gabaritos/`. Correção, revisão espaçada e % de acerto usam sempre a letra oficial; **questões anuladas ficam fora das estatísticas** e contam como certas no simulado. A página Gabaritos lista as 7 questões em que a banca divergiu da resolução de estudo.

O gabarito definitivo do **ENARE 2026/27** (FGV) ainda não saiu (previsto para 13/10/2026): quando sair, cole-o na página Gabaritos (“1-C 2-A…” ou 100 letras seguidas, `*` = anulada).

### Flashcards

- Notas: **Errei** (volta em 10 min), **Difícil**, **Bom**, **Fácil**; intervalos 1 → 3 → ×facilidade, mais curtos nos temas com menor % de acerto. Até 20 cartões novos por dia por baralho.
- Lógica em [`src/lib/flash.ts`](src/lib/flash.ts); baralho de lei seca em [`src/data/leiseca.ts`](src/data/leiseca.ts) (cada cartão tem o link da norma — confira sempre a redação vigente).

### Lembrete diário (Web Push)

- O app envia ao Supabase a previsão de revisões por dia (`user_state`, tipo `forecast`); a Edge Function [`send-reminders`](supabase/functions/send-reminders/index.ts) roda **de hora em hora** (pg_cron + pg_net) e notifica quem está no horário escolhido **e** tem pendências.
- Web Push implementado só com WebCrypto ([`webpush.ts`](supabase/functions/send-reminders/webpush.ts), testado em `webpush.test.ts`). Chaves VAPID e segredo do cron ficam no **Vault** (`vapid_public`, `vapid_private`, `vapid_subject`, `reminder_cron_secret`, `project_url`); a função lê pela RPC `reminder_config()` (só `service_role`).
- iPhone/iPad: só com o app instalado na Tela de Início (iOS 16.4+).

## Estrutura

```
src/
  data/questions/*.json   banco de questões (enunciado, alternativas, gabarito, comentário, tema)
  data/topics.ts          conteúdo programático, bibliografia do edital, aulas
  data/plan.ts            cronograma (fase FDT + fase ENARE), recalculado pelas datas
  lib/srs.ts              revisão espaçada + estatísticas por tema
  lib/store.ts            armazenamento offline (localStorage)
  lib/sync.ts             sincronização com o Supabase
  data/official.ts        gabaritos definitivos das bancas (+ justificativas)
  data/leiseca.ts         baralho de lei seca
  lib/flash.ts, decks.ts  flashcards (agendamento, baralhos, previsão para o lembrete)
  lib/push.ts             inscrição do aparelho no lembrete diário
  pages/                  Hoje, Plano, Questões, Revisão, Conteúdo, Sessão, Gabaritos, Flashcards, Ajustes
public/provas/            PDFs originais das provas, do Anexo I e dos gabaritos oficiais
public/push-handler.js    recebe a notificação no service worker
supabase/migrations/      schema do banco (attempts, user_state, push_subscriptions, cron do lembrete)
supabase/functions/       Edge Function send-reminders
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

- **Supabase** — projeto `residencia-odonto` (região São Paulo). Tabelas `attempts` (cada resposta), `user_state` (favoritos, anotações, checklist, ajustes, flashcards, gabaritos importados, previsão de revisões) e `push_subscriptions` (aparelhos do lembrete), com RLS: cada usuário só lê e grava os próprios dados.
- **Vercel** — build `npm run build`, saída `dist/`, variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave publicável).

### Passo único no painel do Supabase

Em **Authentication → URL Configuration**, defina o **Site URL** como o endereço do app na Vercel e inclua-o em **Redirect URLs**. Assim os links de confirmação de cadastro e de troca de senha abrem o app (sem isso eles abrem `localhost`; a conta é confirmada mesmo assim, basta voltar ao app e entrar com e-mail e senha).

## Como adicionar uma prova nova

1. Gere `src/data/questions/<id>.json` no mesmo formato (`id`, `exam`, `n`, `block`, `topic`, `stem`, `opts`, `answer`, `ex`).
2. Registre a prova em `src/data/exams.ts` (`EXAMS` e `QUESTIONS`) e o PDF em `public/provas/`.
3. Se já houver gabarito definitivo, adicione-o em `src/data/official.ts` (o da FDT 2022 já está lá, em `FDT2022_KEY`, aguardando o caderno da prova).
4. `npm test && npm run build`, commit e push na `main` — a Vercel publica sozinha.
