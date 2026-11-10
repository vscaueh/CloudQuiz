# Validação - 10/11/2026

- Vitest: 9 testes aprovados.
- Navegador local: 3 testes aprovados, incluindo fluxo real no Back4App (login, sessão após recarga, partida de dez perguntas, resultado salvo, ranking, histórico e logout) e treino/layout móvel de 390 px.
- Verificação remota administrativa: 11 verificações aprovadas; relatório em remote-verification.json. Pontuação de 1.000 pontos com dez acertos; gabarito privado; consulta direta às classes negada; acesso de outro jogador à partida negado; reenvio idempotente e alteração posterior negada.
- Índices únicos no Back4App: Answer.dedupeKey e Score.matchKey confirmados como SUCCESS/Unique=True no painel.
- Banco com 24 perguntas reais. Cloud Code publicado e executado.
- GitHub Actions: execução 42904536275 aprovada no PR #1. Teste de nuvem no CI ainda depende das credenciais dedicadas; o teste real foi executado no computador, não se confunde com o CI.
- Build de produção concluído com configuração pública do app.

## Pendências de validação

Publicação e teste no endereço Azure; execução em Codespaces; sincronização das últimas correções no GitHub; entrega do relatório e gravação do vídeo. Não foram testados envio de e-mail ou recuperação de senha, funcionalidades que esta versão não oferece. A configuração de política mínima de senha do servidor depende das opções disponíveis no plano; a interface exige oito caracteres e o trigger aplica a validação quando o Parse disponibiliza a senha.
