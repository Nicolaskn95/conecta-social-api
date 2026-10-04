/**
 * Contexto de transação opaco. Cada adapter de banco carrega internamente
 * o seu objeto (Prisma TransactionClient / Mongo ClientSession).
 * Services apenas repassam o `ctx` aos repositórios.
 */
export interface TransactionContext {
  readonly __transactionContext: true;
}

export abstract class TransactionManager {
  abstract run<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}
