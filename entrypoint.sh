#!/bin/sh

# echo "⏳ Esperando o banco de dados iniciar..."
# until nc -z db 5432; do
#   sleep 1
# done

echo "✅ Banco de dados disponível!"

echo "⚙️ Gerando Prisma Client..."
yarn prisma generate

echo "📦 Aplicando migrations..."
yarn prisma migrate deploy

echo "🌱 Rodando seed do Prisma..."
yarn seed:prod

echo "🚀 Iniciando aplicação NestJS..."
exec yarn start:prod
