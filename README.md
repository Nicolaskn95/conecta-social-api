# 🌱 Conecta Social — API (Backend)

> API responsável por gerenciar dados do Conecta Social: eventos, voluntários, famílias e doações.  
> Desenvolvida para ser leve, testável e escalável.

---

## 📋 Índice

-  [Sobre o Projeto](#-sobre-o-projeto)
-  [Funcionalidades Principais](#-funcionalidades-principais)
-  [Entregas de Sprints (Jira)](#-entregas-de-sprints-jira)
-  [Tecnologias](#-tecnologias)
-  [Estrutura do Projeto](#-estrutura-do-projeto)
-  [Instalação e Execução](#-instalação-e-execução)
-  [Docker](#-docker)
-  [Comandos úteis](#-comandos-úteis)
-  [Links úteis](#-links-úteis)
-  [Contribuição](#-contribuição)
-  [Licença](#-licença)
-  [Contato](#-contato)

## 🎯 Sobre o Projeto

O Conecta Social é uma plataforma para apoiar organizações sociais com ferramentas para gerenciamento de voluntariado, eventos, famílias beneficiárias e doações. Esta API fornece os endpoints consumidos pelo frontend e integrações com microserviços (por exemplo: validação e geração de embeds do Instagram).

## ✨ Funcionalidades Principais

- CRUD de eventos, voluntários, famílias e doações
- Endpoints públicos para listagem de eventos (próximos, recentes)
- Paginação e filtros para listagens
- Integração com microserviços (validação de URLs e geração de embeds)
- Autenticação via JWT para endpoints protegidos
- Soft-delete para recursos quando aplicável

## 🚀 Entregas de Sprints (Jira)

Link do Jira: https://blackandyellow.atlassian.net/jira/software/c/projects/CS/boards/37

| Sprint | Período    | Incrementos Desenvolvidos |
|--------|------------|---------------------------|
| 1      | 2025.1     | • Finalização do projeto base do 2º semestre • Estruturação inicial da API • Endpoints básicos |
| 2      | 2025.2     | • Listagens públicas de eventos • Autenticação e autorização • Integração inicial com microserviços |
| 3      | 2025.2     | • Ajustes e correções • Preparação do ambiente de produção • Deploy da API |
| 4      | 2025.2     | • Refinamentos finais • Documentação e testes • Preparação da apresentação |
| 5      | 2025.2     | • Ajustes finais • Testes unitários • Preparação da segunda apresentação |

## 🛠 Tecnologias

- NestJS (Framework)
- TypeScript
- Prisma ORM
- PostgreSQL
- Docker & Docker Compose
- jest / supertest (testes) — conforme setup do projeto
- Undici / fetch (chamadas a microserviços)

## 📁 Estrutura do Projeto (resumida)

```
src/
├── config/        # configuração (Prisma, env, etc)
├── modules/       # módulos por domínio (event, volunteer, family, auth...)
│   ├── event/
│   └── ...
├── common/        # middlewares, interceptors, guards, dtos, helpers
├── main.ts        # bootstrap da aplicação
└── prisma/        # schema e migrations (quando aplicável)
```

## 🚀 Instalação e Execução (local)

### Pré-requisitos
- Node.js 18+
- Yarn / npm / pnpm
- Docker (opcional para execução em container)
- PostgreSQL local ou via Docker

### Instalação
```bash
git clone <repo-url>
cd conecta-social-api
yarn install
```

### Configurar variáveis de ambiente
Crie ou edite `.env` com as variáveis necessárias (ex.: DATABASE_URL, JWT_SECRET, JWT_EXPIRATION, PORT).

### Gerar Prisma e executar migrations
```bash
yarn prisma generate
yarn prisma migrate dev --name init
```

### Rodar em modo de desenvolvimento
```bash
yarn start:dev
# ou
yarn run dev
```

## 🐳 Docker

### Build e iniciar containers
```bash
docker compose up --build
```

### Parar containers
```bash
docker compose down
```

### Parar e apagar volumes (reseta banco)
```bash
docker compose down -v
```

## 🧪 Comandos úteis

- Rodar apenas a API:
  ```bash
  docker compose up api
  ```
- Rebuild forçado da API:
  ```bash
  docker compose up --build api
  ```
- Executar migrations dentro do container:
  ```bash
  docker exec -it <api-container> yarn prisma migrate deploy
  ```
- Executar testes:
  ```bash
  yarn test
  ```

## 🔐 Autenticação

A API usa JWT. Configure `JWT_SECRET` e `JWT_EXPIRATION` no `.env`. Endpoints protegidos requerem o header Authorization: Bearer <token>.

## 🐛 Troubleshooting (comum)

- Erro de conexão com banco: verifique `DATABASE_URL` e se o serviço do DB está acessível (no Docker use o nome do serviço, ex.: `db`).
- Embeds de Instagram: a validação e a geração do HTML acontecem internamente no módulo de eventos. Se houver falha, valide o formato da URL do post em `embedded_instagram`.

## 🔗 Links úteis
- Backend (produção): https://conecta-social-api.onrender.com
- Swagger (API docs): https://conecta-social-api.onrender.com/api/docs
- Frontend (produção): https://conecta-social-fatec.vercel.app/
- Repositório frontend: https://github.com/Nicolaskn95/conecta-social-web
- Documentação completa do projeto: https://docs.google.com/document/d/1b2XceqbDNY6t0D4t--pnbQzrkYjZE238jI3S_xjG8rs/edit?usp=sharing

## 📑 Requisitos funcionais


| Código | Descrição |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| RF01   | CADASTRO DE VOLUNTÁRIOS: o administrador do sistema deverá ter a possibilidade de cadastrar outros usuários no sistema.                                                |
| RF02   | O administrador deve ser cadastrado pelo time técnico no momento da entrega do software, pois não terá área pública de cadastro.                                       |
| RF03   | GESTÃO DE DOAÇÕES: área para registrar e acompanhar doações recebidas e alocar recursos conforme necessário.                                                            |
| RF04   | GESTÃO DE EVENTOS: área para registrar, alterar, vincular doações e acompanhar eventos; na área não logada serão exibidos últimos eventos e próximos eventos do calendário. |
| RF05   | GESTÃO DE FAMÍLIAS: área para registrar, alterar e visualizar as famílias para agrupar e vincular as pessoas ajudadas.                                                  |
| RF06   | ÁREA NÃO LOGADA: usuários sem login devem conseguir visualizar próximos eventos e a história do projeto social.                                                         |

## 🛡 Requisitos não funcionais


| Código | Descrição |
|--------|------------------------------------------------------------------------------------------------------------------------------------|
| RNF01  | A interface deverá ter layout responsivo e navegação intuitiva.                                                                   |
| RNF02  | Login com e-mail/senha; senhas criptografadas com bcrypt e JWT Passport.                                                          |
| RNF03  | O sistema deve processar pelo menos 10 requisições por minuto.                                                                    |
| RNF04  | O sistema deverá ter alta disponibilidade (99% do tempo).                                                                         |
| RNF05  | O sistema deverá seguir a Lei Geral de Proteção de Dados (LGPD).                                                                  |
| RNF06  | O produto deve ser web responsivo.                                                                                                |
| RNF07  | O sistema deverá se comunicar com o banco de dados PostgreSQL.                                                                   |
| RNF08  | O sistema deverá ser desenvolvido utilizando a linguagem Javascript.                                                              |

## 🤝 Contribuição

1. Fork este repositório
2. Crie uma branch: `git checkout -b minha-feature`
3. Faça commit das mudanças: `git commit -m 'feat: minha nova feature'`
4. Push para a branch: `git push origin minha-feature`
5. Abra um Pull Request

### Padrões
- Use TypeScript e siga as regras do ESLint/Prettier do projeto
- Escreva testes para novas funcionalidades

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

## 📞 Contato

**Conecta Social**

- Website: [conectasocial.com](https://conecta-social-fatec.vercel.app/)
- **Desenvolvedores:**
> Maicon Rodrigues dos Santos ([GitHub](github.com/maiconmaul))

> Nicolas Katsuji Nagano ([GitHub](github.com/Nicolaskn95))

> Matheus Tadao Momiy

> Caio Fernando Scudeler

> Nicollas Mencacci Pereira


---

<div align="center">
  <p>Feito com ❤️ para transformar vidas através da solidariedade</p>
  <p>🌱 <strong>Conecta Social</strong> - Conectando tecnologia com projetos sociais</p>
</div>
