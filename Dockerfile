# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app

# Copia arquivos necessários
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# Gera Prisma Client e compila a aplicação
RUN yarn prisma generate
RUN yarn build

# Etapa final: runtime clean
FROM node:20-alpine
WORKDIR /app

# Copia apenas o necessário para rodar a aplicação
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/prisma ./prisma

# Copia o script de entrada
COPY entrypoint.sh .

# Dá permissão de execução
RUN chmod +x entrypoint.sh

# Define o ponto de entrada (roda prisma + inicia app)
ENTRYPOINT ["./entrypoint.sh"]
