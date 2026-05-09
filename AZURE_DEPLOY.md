# Deploy do Backend na Azure

Este guia adiciona a Azure como terceiro ambiente do backend, mantendo Render e AWS ativos. Neste primeiro momento, a Azure usa a imagem publicada no DockerHub e o banco PostgreSQL atual. Azure Container Registry e Azure Database for PostgreSQL ficam como próximos passos.

## 1. Viabilidade no Azure Educacao

Com Azure for Students, voce consegue executar este primeiro desenho porque ele precisa apenas de App Service for Containers, DockerHub e um banco externo ja existente. A conta de estudante oferece credito inicial e dispensa cartao de credito, mas recursos pagos consomem esse credito.

Recomendacao inicial:

- Comece com o menor App Service Plan Linux disponivel para container no seu portal.
- Se o tier gratuito nao aceitar container ou ficar instavel, use `B1` e monitore o credito.
- Desligue recursos que nao estiver usando em apresentacoes/testes longos.

Referencias:

- [Azure for Students](https://learn.microsoft.com/azure/education-hub/about-azure-for-students)
- [FAQ Azure Education](https://learn.microsoft.com/en-us/azure/education-hub/faq)
- [App Service plans e tiers](https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans)

## 2. Criar recursos pelo portal

1. Acesse o [Azure Portal](https://portal.azure.com/).
2. Crie um Resource Group, por exemplo `rg-conecta-social-prod`.
3. Crie um App Service:
   - Publish: `Docker Container`
   - Operating System: `Linux`
   - Region: prefira a mais proxima do banco atual ou do publico.
   - App Service Plan: comece pequeno; use `B1` se o gratuito nao atender.
4. Na aba de container, selecione DockerHub:
   - Image: `DOCKERHUB_USERNAME/conecta-social-api`
   - Tag: `latest`
   - Se o repositorio DockerHub for privado, informe usuario e token/senha.
5. Depois de criado, abra `Settings > Environment variables` e configure os App Settings.

Referencias:

- [App Service custom container com GitHub Actions](https://learn.microsoft.com/en-us/azure/app-service/deploy-container-github-action)
- [Configurar container customizado e WEBSITES_PORT](https://learn.microsoft.com/es-es/azure/app-service/configure-custom-container)

## 3. App Settings obrigatorios

Configure estes valores no App Service da Azure:

```env
WEBSITES_PORT=3001
PORT=3001
DATABASE_URL=<connection string do banco atual>
JWT_SECRET=<segredo forte>
JWT_EXPIRATION=1d
CORS_ORIGINS=https://conecta-social-fatec.vercel.app,https://<app-azure>.azurewebsites.net,http://localhost:3000,http://127.0.0.1:3000
RUN_MIGRATIONS=false
RUN_SEED=false
ADMIN_EMAIL=admin@conecta.com
ADMIN_PASSWORD=<senha forte para uso apenas quando RUN_SEED=true>
ADMIN_NAME=Admin
ADMIN_SURNAME=Root
ADMIN_ROLE=ADMIN
BETTER_STACK_URL=<url de ingestao>
BETTER_STACK_TOKEN=<token>
AWS_REGION=<regiao atual do bucket>
AWS_S3_BUCKET=<bucket atual>
AWS_ACCESS_KEY_ID=<access key>
AWS_SECRET_ACCESS_KEY=<secret key>
AWS_SESSION_TOKEN=<session token se existir>
AWS_S3_SIGNED_URL_EXPIRES=3600
```

Observacoes:

- `RUN_MIGRATIONS=false` e `RUN_SEED=false` evitam que todo restart tente alterar banco.
- As migrations rodam no GitHub Actions usando `DATABASE_URL`.
- Se precisar criar o admin em um banco vazio, rode o seed uma vez com `RUN_SEED=true`, `ADMIN_PASSWORD` configurado e `ADMIN_ROLE=ADMIN`; depois volte para `RUN_SEED=false`.
- Em `CORS_ORIGINS`, nao use barra final nas URLs.

## 4. Secrets no GitHub

No repositorio `conecta-social-api`, configure estes secrets:

```env
AZURE_WEBAPP_NAME=<nome do App Service>
AZURE_WEBAPP_PUBLISH_PROFILE=<conteudo completo do publish profile>
DOCKERHUB_USERNAME=<usuario DockerHub>
DOCKER_PASSWORD=<token/senha DockerHub>
DATABASE_URL=<connection string usada no migrate deploy>
GH_TOKEN=<token ja usado pelo release atual>
RENDER_DEPLOY_URL=<deploy hook atual da Render>
EC2_HOST=<host atual AWS>
EC2_USER=<usuario atual AWS>
EC2_PRIVATE_KEY=<chave atual AWS>
```

Como contas Azure Educacao institucionais podem bloquear Microsoft Entra ID/IAM, o workflow usa Publish Profile em vez de OIDC. Para obter o valor:

1. Abra o App Service no Azure Portal.
2. Na tela `Visao geral`, clique em `Baixar perfil de publicacao` ou `Get publish profile`.
3. Abra o arquivo `.PublishSettings` baixado.
4. Copie todo o conteudo XML do arquivo.
5. Crie o secret `AZURE_WEBAPP_PUBLISH_PROFILE` no GitHub com esse conteudo completo.

Se o botao nao aparecer ou falhar, habilite publicacao basica no App Service em `Configuracao > Configuracao geral` ou procure por `Basic Auth Publishing Credentials`, salve e tente baixar o publish profile novamente.

## 5. Fluxo de deploy

Ao fazer push na `main`:

1. CI instala dependencias, gera Prisma Client, valida schema, builda e testa.
2. CD aplica `prisma migrate deploy` uma vez no banco atual.
3. CD publica a imagem Docker no DockerHub.
4. Render recebe o deploy hook atual.
5. AWS atualiza o container na EC2.
6. Azure atualiza o App Service para a imagem `latest` do DockerHub usando o Publish Profile.

## 6. Validacao

Depois do deploy Azure:

1. Acesse `https://<app-azure>.azurewebsites.net/`.
2. Confirme resposta com `Server is running`.
3. Acesse `https://<app-azure>.azurewebsites.net/api/docs`.
4. Atualize `CORS_ORIGINS` na Azure, Render e AWS para incluir:
   - frontend Vercel oficial;
   - URL do backend Azure;
   - localhost para desenvolvimento.
5. Teste login pelo frontend Vercel apontando para o backend desejado.

## 7. Proximos passos Azure

Quando quiser evoluir para uma infra Azure mais completa:

1. Criar Azure Container Registry e alterar o workflow para publicar no ACR.
2. Trocar DockerHub por ACR no App Service.
3. Criar Azure Database for PostgreSQL Flexible Server.
4. Migrar dados do banco atual para o PostgreSQL da Azure.
5. Atualizar `DATABASE_URL` e rodar `prisma migrate deploy`.
6. Avaliar Azure Blob Storage para substituir o S3 nas imagens de doacao.

Referencias:

- [Azure Database for PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-deploy-on-azure-free-account)
- [Azure Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal)
- [Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-overview)
