# CloudQuiz - Grupo 1

Mini-game de perguntas sobre computação em nuvem. HTML, CSS e JavaScript (template vanilla com Vite), Back4App/Parse, GitHub Codespaces, GitHub Actions e Azure Static Web Apps.

## Estado desta versão - 10/11/2026

Frontend e Cloud Code implementados. Back4App conectado, 24 perguntas carregadas, classes protegidas e índices únicos confirmados. Login, partida completa, ranking, histórico e restauração da sessão passaram em teste real no navegador. Jogo publicado no Azure Static Web Apps Free e testado no endereço público. Codespaces executado com nove testes e build aprovados. Consulte docs/VALIDACAO.md e docs/ENTREGA-AVA.md para a situação de publicação e entrega. **O vídeo e o relatório final ainda serão preparados.**

Sem configuração, o site oferece **modo treino**, com um banco separado de perguntas e resultados somente na memória da sessão. Ele não cria contas, não simula login e não anuncia gravação em nuvem. Use-o para conferir a experiência, não como prova dos requisitos de integração.

## Rodar no computador

Requer Node.js 22.12 ou superior (recomendado Node 24) e internet para instalação.

```sh
npm ci
npm run dev
```

Abra a URL mostrada no terminal, normalmente http://localhost:5173. Não abra index.html por duplo clique. Sem Back4App, use **Experimentar modo treino**.

## Conectar o jogo real

1. Siga `docs/BACK4APP.md` para criar o app, preparar classes, índices e publicar Cloud Code.
2. Copie `.env.example` para `.env` e preencha **Application ID** e **JavaScript Key**. Não use a Master Key no frontend.
3. Reinicie o servidor do Vite. Crie uma conta de jogador e valide a partida real.
4. Siga `docs/AZURE-E-GITHUB.md` para publicar e ativar os workflows.

## Regras

- 10 questões por partida, selecionadas no servidor entre 24 perguntas iniciais.
- 4 alternativas e uma única resposta por questão.
- 100 pontos por acerto, sem penalidade e máximo de 1.000 pontos.
- Ranking das 10 melhores partidas; empate favorece a conclusão mais antiga.
- Uma pessoa pode aparecer várias vezes no ranking. Histórico mostra os 20 resultados mais recentes.
- Recarregar a página mantém a conta e permite retomar a partida da sessão atual. Logout encerra a sessão local e limpa a referência de retomada.

## Estrutura

```text
src/                     Interface, API de nuvem e treino explícito
cloud/main.js            Registro das funções e proteção das classes
cloud/service.cjs        Regras de início, resposta, consulta e finalização
cloud/repository.cjs     Persistência Parse com deduplicação no banco
cloud/rules.cjs          Validações e cálculo de pontos
data/questions.json      Questões reais e gabarito (não entram no build do frontend)
scripts/setup-back4app.mjs Classes, CLP, índices únicos e carga inicial
tests/                   Testes de regras e de navegador
.devcontainer/           Ambiente GitHub Codespaces
.github/workflows/       CI e publicação Azure
public/staticwebapp.config.json Cabeçalhos e configuração Azure
docs/                    Instruções e acompanhamento da entrega
```

O snapshot privado das perguntas em Match contém o gabarito e nunca é disponibilizado por consulta direta. As funções de nuvem entregam somente a pergunta atual sem gabarito, depois de validar a sessão e a propriedade da partida. As classes do jogo negam acesso direto ao cliente; o servidor grava com Master Key. O ranking expõe somente apelido, pontos, acertos e data.

## Testes

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

O teste E2E da nuvem só executa com `CLOUDQUIZ_TEST_USERNAME`, `CLOUDQUIZ_TEST_PASSWORD` e o app configurado. Sem isso, ele aparece como **skipped**. Consulte `docs/VALIDACAO.md` para o que foi efetivamente verificado nesta entrega.

## Equipe

- Caueh Bento de Lima Mota - 26120706
- Vinicius Ferreira dos Santos Correia - 2522711
- João Lucas Ferreira - 2612740
- Matheus Lucas Oliveira - 2612700

Fontes técnicas: [Parse JS](https://docs.parseplatform.org/js/guide/), [Cloud Code](https://docs.parseplatform.org/cloudcode/guide/), [Back4App](https://www.back4app.com/docs), [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/overview).
