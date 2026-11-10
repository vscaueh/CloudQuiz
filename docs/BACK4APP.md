# Preparar o Back4App

Estas instruções são para o app dedicado **CloudQuiz** da equipe. Não execute o setup em uma aplicação com dados de outro projeto.

## Conta e app

1. Crie sua conta em https://www.back4app.com/ e entre no painel. A criação da conta e a aceitação dos termos devem ser feitas por você.
2. Crie um **Backend as a Service / Parse App**, nome CloudQuiz. Selecione a opção gratuita disponível e confira os limites antes de confirmar qualquer contratação.
3. No painel, abra **Server Settings / Core Settings** e localize Application ID, JavaScript Key, Master Key e Database URI. Menus podem variar conforme a versão.
4. Nunca envie Master Key ou Database URI pelo chat, vídeo, captura ou repositório. Essas credenciais serão usadas somente no ambiente administrativo do setup.

## Classes e índices

Copie `.env.server.example` para `.env.server` e preencha os valores do app. O URI precisa identificar o banco MongoDB desse mesmo aplicativo. Não use o URI de outro banco.

```sh
npm ci
node --env-file=.env.server scripts/setup-back4app.mjs
```

O script é reaplicável para os campos previstos e atualiza o banco de questões pelos códigos. Não apaga contas ou partidas. Ele bloqueia acesso direto às classes Question, Match, Answer e Score. Usa o MongoDB apenas para instalar índices únicos, sem alterar documentos internos do Parse.

**Os índices únicos são obrigatórios**: Answer.dedupeKey e Score.matchKey impedem respostas/placares duplicados inclusive com requisições concorrentes. O setup deve terminar sem erro antes do teste real. Se já existirem dados duplicados, ele falhará ao criar o índice: investigue os dados, não remova o índice nem desative as proteções. Se o plano não permitir acesso ao Database URI, o índice deve ser criado por um recurso administrativo compatível do provedor e verificado antes de prosseguir. Não há garantia de concorrência sem esses índices.

Campos implementados: Question(code, statement, options, correctIndex, topic, active); Match(player, nickname, questionSet, status, score, answeredCount, finishedAt); Answer(player, match, dedupeKey, questionId, selectedIndex, isCorrect); Score(player, match, matchKey, nicknameSnapshot, points, correctCount). objectId, createdAt e updatedAt são da plataforma. São 24 questões iniciais.

Diferença em relação ao plano: o gabarito de cada partida é um snapshot privado em Match.questionSet. O cliente não lê Match diretamente. O andamento é calculado por Answer, e os campos de resumo de Match são atualizados ao finalizar. Isso evita usar contadores mutáveis do cliente como fonte da pontuação.

## Cloud Code

Na área **Cloud Code / Functions**, publique os quatro arquivos dentro de `cloud/`:

- `main.js`
- `rules.cjs`
- `service.cjs`
- `repository.cjs`

Mantenha os arquivos no mesmo diretório de entrada. O `main.js` utiliza a instância Parse fornecida pelo ambiente. As rotinas usam APIs modernas do Parse e `node:crypto`; selecione runtime Node compatível (Node 18 ou superior) no Back4App.

Funções: getPlayer, startMatch, getMatch, submitAnswer, getLeaderboard, getHistory. Todas exigem sessão. A chamada submitAnswer recebe matchId, questionId e selectedIndex; a pontuação é calculada no servidor. Erros de banco não são tratados como sucesso.

No painel de autenticação, mantenha signup por usuário/senha habilitado e configure política de senha mínima de 8 caracteres. Se confirmação de e-mail for exigida, configure envio e confirme a conta antes de usar o login. Não altere requisitos de segurança apenas para contornar um erro.

## Chaves do frontend

Em `.env`:

```dotenv
VITE_PARSE_APP_ID=application_id_do_seu_app
VITE_PARSE_JAVASCRIPT_KEY=javascript_key_do_seu_app
VITE_PARSE_SERVER_URL=https://parseapi.back4app.com
```

Essas chaves cliente são incorporadas ao site. Elas não substituem CLP/ACL e a validação das funções. Nunca use prefixo VITE_ para segredos. Reinicie o Vite depois de alterar o arquivo. Em produção, as variáveis precisam estar presentes **durante o build**, não apenas após o deploy.

## Teste obrigatório antes do vídeo

Crie duas contas de teste dedicadas. Na A, conclua uma partida e compare os registros no painel. Na B, tente consultar e responder a partida A por Cloud Code: deve falhar. Reenvie uma resposta idêntica e depois uma resposta diferente para a mesma questão: não pode haver ponto extra. Ao final, confira exatamente um Score para a Match. Recarregue, valide a sessão e teste o logout. Consultas diretas a Question/Match/Answer/Score devem ser negadas. Use getLeaderboard para o ranking público da conta autenticada.

O limite de 1.000 questões no carregamento é suficiente ao banco acadêmico de 24 perguntas. Escala maior, rate limiting, proteção adicional de signup e retenção de partidas abandonadas são evoluções, não recursos afirmados nesta versão.
