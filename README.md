# 📦 Conecta Social API

API do projeto Conecta Social, desenvolvida em **NestJS + PostgreSQL** com suporte a **Docker Compose** para facilitar o desenvolvimento e a execução.

---

## 🚀 Tecnologias

- [NestJS](https://nestjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Prisma ORM](https://www.prisma.io/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## ✅ Requisitos

- Docker e Docker Compose instalados
- Node.js (opcional para desenvolvimento local sem Docker)

---

## 📁 Setup do Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/conecta-social-api.git
cd conecta-social-api
```

### 2. Crie um arquivo `.env`

Você pode usar o modelo `.env.example` (caso exista) ou criar um novo:

```env
# .env
DATABASE_URL=postgresql://postgres:postgres@db:5432/mydb
JWT_SECRET=algumasecret
JWT_EXPIRATION=3600s
PORT=3001

# Logs/observabilidade
BETTER_STACK_URL=
BETTER_STACK_TOKEN=
```

---

## 🐳 Usando Docker Compose

### 🔧 Build e iniciar containers

```bash
docker compose up --build
```

### ⏹ Parar os containers

```bash
docker compose down
```

### 🔄 Parar e apagar volumes (banco zerado)

```bash
docker compose down -v
```

---

## 🧪 Comandos úteis

### Rodar apenas a API (sem rebuild)

```bash
docker compose up api
```

### Rebuild forçado da API (útil após alterações no Dockerfile ou dependências)

```bash
docker compose up --build api
```

---

## ⚙️ Executando sem Docker (modo local)

Você também pode rodar a API localmente, sem o uso do Docker:

### 1. Instale as dependências

```bash
yarn install
```

### 2. Configure o banco de dados local

Certifique-se de que você tenha um PostgreSQL rodando localmente e um arquivo `.env` com as seguintes variáveis:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/mydb
JWT_SECRET=algumasecret
JWT_EXPIRATION=1d
PORT=3001
```

### 3. Execute as migrations e o seed (opcional)

```bash
yarn prisma generate
yarn prisma migrate deploy
yarn seed:prod
```

### 4. Inicie a aplicação

```bash
yarn run dev
```

A aplicação será iniciada em modo desenvolvimento na porta definida (ex: `http://localhost:3001`).

---

## 🔐 Autenticação

A autenticação usa JWT. As variáveis `JWT_SECRET` e `JWT_EXPIRATION` controlam a geração e validação de tokens.

---

## 🧬 Prisma

O script `entrypoint.sh` dentro do container da API executa automaticamente:

- `prisma generate`
- `prisma migrate deploy`
- `yarn seed:prod` (popula dados iniciais)

Se quiser rodar manualmente:

```bash
docker exec -it nest-api yarn prisma migrate deploy
docker exec -it nest-api yarn prisma studio
```

---

## 🧩 Estrutura de serviços (Docker Compose)

| Serviço | Porta | Descrição                    |
|---------|-------|------------------------------|
| `db`    | 5432  | PostgreSQL                   |
| `api`   | 3001  | API NestJS em produção       |

---

## 🐛 Troubleshooting

### ❌ `Can't reach database server at localhost:5432`

> Provavelmente está usando `localhost` na `DATABASE_URL`.

✅ Solução: use `db` (nome do serviço no docker-compose), por exemplo:  
`postgresql://postgres:postgres@db:5432/mydb`

---

## 🤝 Contribuindo

1. Fork este repositório
2. Crie uma branch: `git checkout -b minha-feature`
3. Faça commit das mudanças: `git commit -m 'feat: minha nova feature'`
4. Push para a branch: `git push origin minha-feature`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

## 💡 Contato

Desenvolvido com 💙 por [Maicon Santos](https://github.com/maiconmaul), [Matheus Tadao](https://github.com/tadaomomiy) e [Nicolas Nagano](https://github.com/Nicolaskn95)# ms-cs-dashboard
