#!/bin/sh
echo "⚙️ Gerando Prisma Client..."
yarn prisma generate

echo "📦 Aplicando migrations..."
yarn prisma migrate deploy

echo "🌱 Rodando seed do Prisma..."
yarn seed:prod

echo "🚀 Iniciando aplicação NestJS..."
exec yarn start:prod
