# Validação - 10/11/2026

- Vitest: 9 testes aprovados.
- Navegador local: 3 testes aprovados, incluindo fluxo real no Back4App (login, sessão após recarga, partida de dez perguntas, resultado salvo, ranking, histórico e logout) e treino/layout móvel de 390 px.
- Verificação remota administrativa: 11 verificações aprovadas; relatório em remote-verification.json. Pontuação de 1.000 pontos com dez acertos; gabarito privado; consulta direta às classes negada; acesso de outro jogador à partida negado; reenvio idempotente e alteração posterior negada.
- Índices únicos no Back4App: Answer.dedupeKey e Score.matchKey confirmados como SUCCESS/Unique=True no painel.
- Banco com 24 perguntas reais. Cloud Code publicado e executado.
- GitHub Actions: execuções 42907198028 e 42907455460 aprovadas nos PRs #1 e #2. Teste de nuvem no CI ainda depende das credenciais dedicadas; o teste real foi executado no computador, não se confunde com o CI.
- Build de produção concluído com configuração pública do app.

- Azure: publicado em https://victorious-pond-0a0cb9d10.5.azurestaticapps.net. Os três testes de navegador também passaram usando esse endereço público, incluindo a integração real com Back4App.

## Pendências de validação

entrega do relatório e gravação do vídeo. Não foram testados envio de e-mail ou recuperação de senha, funcionalidades que esta versão não oferece. A configuração de política mínima de senha do servidor depende das opções disponíveis no plano; a interface exige oito caracteres e o trigger aplica a validação quando o Parse disponibiliza a senha.

## Codespaces validado

Ambiente reconstruído com javascript-node:22-bookworm após corrigir a tag indisponível. Nove testes unitários aprovados e build de produção concluído no próprio Codespaces. Servidor Vite em execução na porta 5173; requisição HTTP interna retornou o HTML do CloudQuiz. Prévia encaminhada com visibilidade Private. O fluxo visual completo foi testado no Azure; não foi repetido no endereço privado encaminhado.

Editor: https://fuzzy-barnacle-7v96pj7p49652qx7.github.dev/

Prévia: https://fuzzy-barnacle-7v96pj7p49652qx7-5173.app.github.dev/
