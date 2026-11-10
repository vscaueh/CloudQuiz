# GitHub, Codespaces e Azure

## Repositório e colaboração

Crie um repositório CloudQuiz na conta da equipe. Envie o conteúdo deste diretório, incluindo arquivos ocultos de configuração e `package-lock.json`, sem `node_modules`, `.env` ou `.env.server`. Configure acesso aos integrantes e revisão de PRs conforme a conta permitir. Não envie o arquivo de credenciais ao GitHub.

Branches previstas: `main` estável, `dev` para integração, `feature/nome` para funcionalidades. Use PR de feature para dev e de dev para main. Registre somente contribuições realmente realizadas; não fabrique commits ou revisões retroativas para simular colaboração.

O workflow `ci.yml` executa testes de regras, build e E2E. Sem uma conta de teste e variáveis de app, o teste real da nuvem fica ignorado e somente o treino é verificado. Configure no repositório:

**Variables:** VITE_PARSE_APP_ID, VITE_PARSE_JAVASCRIPT_KEY.

**Secrets:** CLOUDQUIZ_TEST_USERNAME, CLOUDQUIZ_TEST_PASSWORD. Use uma conta exclusiva de teste: a suíte grava uma partida real a cada execução.

## Codespaces

No repositório, use **Code / Codespaces / Create codespace**. A configuração instala dependências e encaminha a porta 5173. Execute `npm run dev` e use a aba Ports para abrir o link. Cadastre as chaves cliente em `.env` no ambiente (ou secrets do Codespaces mapeados ao ambiente) e reinicie o servidor.

O preview depende de Codespace em execução e da visibilidade da porta. Não é hospedagem permanente. Confirme o acesso do professor conforme as regras de compartilhamento do GitHub. O Azure será o endereço público estável da aplicação.

## Azure Static Web Apps

1. Crie/ative a conta Azure, conferindo a assinatura e os limites. A aceitação de termos e qualquer cobrança dependem de você.
2. No portal, crie um recurso **Static Web App** para o frontend. Use o plano Free se estiver disponível e for suficiente. O backend continuará no Back4App; não é preciso criar banco ou API no Azure.
3. O projeto já inclui `.github/workflows/azure.yml`. Se o assistente do Azure gerar outro workflow, desative a duplicação e use apenas um fluxo de publicação validado.
4. Copie o deployment token do recurso para o secret de repositório `AZURE_STATIC_WEB_APPS_API_TOKEN`.
5. Preencha as variables VITE_PARSE_APP_ID e VITE_PARSE_JAVASCRIPT_KEY. O workflow fixa o endpoint oficial Back4App; se houver endpoint customizado, ajuste workflow e CSP juntos.
6. Integre em main. A publicação roda após o workflow CI concluir com sucesso para um push em main, ou por acionamento manual. O fluxo manual também executa testes unitários e build, mas o E2E real precisa ser conferido no CI.
7. Abra o endereço HTTPS entregue pelo Azure, crie a conta e finalize uma partida. Confira o resultado real no Back4App antes de considerar o deploy validado.

Build: `npm ci` e `npm run build`; artefato: `dist`. O arquivo `staticwebapp.config.json` deve estar na raiz de dist após o build. O workflow envia a pasta já compilada com `skip_app_build: true`. Ele recusa publicar se as chaves cliente não estiverem configuradas.

Referência: https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration
