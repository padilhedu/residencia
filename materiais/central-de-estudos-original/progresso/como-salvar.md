# Progresso do quiz — como salvar

## O que fica salvo automaticamente

Quando você responde no quiz (`provas/*.html`), o progresso — respostas, acertos e
questões marcadas com ★ — é gravado **no próprio navegador** (localStorage), no
aparelho em que você respondeu. Fechar a aba não apaga; ele reabre de onde parou.

## O que isso significa

- **Mesmo aparelho e navegador** → progresso preservado, sem fazer nada.
- **Trocar de aparelho** (celular ↔ computador) → o progresso **não** vai junto
  automaticamente, porque cada navegador guarda o seu.
- O botão **"Apagar meu progresso"** (dentro de "Questões") zera tudo.

## O que versionar no GitHub

O GitHub é ideal para os **materiais** (provas, gabaritos, plano, registro de erros).
Esses sim ficam sincronizados entre aparelhos. O fluxo recomendado:

1. Estude e responda no quiz (progresso fica no aparelho).
2. Passe os erros para `plano/registro-de-erros.md`.
3. `commit` + `push` ao fim da sessão.

Assim o que importa para a nota — o histórico dos seus erros e o avanço no edital —
fica seguro, versionado e acessível de qualquer lugar.

> Se quiser sincronização automática do progresso do quiz entre aparelhos,
> dá para evoluir isso depois (versão com login/nuvem). É um passo a mais; me avise
> se valer a pena para você.
