#!/bin/sh
set -e

if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Aplicando migrations do Prisma..."
  yarn prisma migrate deploy
else
  echo "RUN_MIGRATIONS diferente de true. Pulando migrations."
fi

if [ "$RUN_SEED" = "true" ]; then
  if [ -z "$ADMIN_PASSWORD" ]; then
    echo "ADMIN_PASSWORD precisa estar configurado quando RUN_SEED=true."
    exit 1
  fi

  echo "Rodando seed do Prisma..."
  yarn seed:prod
else
  echo "RUN_SEED diferente de true. Pulando seed."
fi

echo "Iniciando aplicação NestJS..."
exec yarn start:prod
