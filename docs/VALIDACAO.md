# Verificação desta versão

Data: 10/11/2026.

## Executado

- Vitest: 9 testes aprovados, cobrindo integridade de 24 perguntas, validação de conta, exigência de sessão, ausência de gabarito no retorno, propriedade da partida, índice inválido, pergunta fora de ordem, 10 acertos/1.000 pontos, pontuação falsificada ignorada, repetição idempotente, concorrência simulada e pontuação zero.
- Testes de navegador: partida de treino completa, resultado, histórico, placar, saída, escolha obrigatória e layout em 390 px. 2 testes aprovados.
- Build de produção concluído.
- npm audit das dependências de produção: nenhuma vulnerabilidade reportada na consulta.
- Interface inspecionada no navegador.

## Limites

O repositório de teste do serviço é em memória e simula o contrato de índices únicos. Isso não comprova índices em um banco real. O treino não usa uma conta real nem persiste dados em nuvem. O teste E2E de Back4App ficou **skipped**, pois o usuário ainda não possui as contas do Back4App e do Azure configuradas.

Não foram verificados nesta etapa: instalação do Cloud Code no runtime Back4App, CLP/ACL remotas, configuração de senha, criação dos índices no MongoDB, envio de e-mail, persistência após novo login, GitHub Actions no GitHub e deploy Azure. Esses itens devem passar antes de gravar o vídeo e finalizar o relatório.
