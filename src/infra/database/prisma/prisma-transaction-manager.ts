import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  TransactionContext,
  TransactionManager,
} from '@/domain/transaction/transaction-manager';
import { PrismaService } from './prisma.service';

export class PrismaTransactionContext implements TransactionContext {
  readonly __transactionContext = true as const;
  constructor(readonly client: Prisma.TransactionClient) {}
}

/** Retorna o client da transação (se houver) ou o PrismaService padrão. */
export function resolvePrismaClient(
  prisma: PrismaService,
  ctx?: TransactionContext
): Prisma.TransactionClient {
  return ctx instanceof PrismaTransactionContext ? ctx.client : prisma;
}

/** Converte tipos gerados pelo Prisma para as entidades de domínio. */
export function toDomain<T>(value: unknown): T {
  return value as T;
}

@Injectable()
export class PrismaTransactionManager extends TransactionManager {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  run<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) =>
      work(new PrismaTransactionContext(tx))
    );
  }
}
