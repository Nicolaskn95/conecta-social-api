import { TransactionContext, TransactionManager } from './transaction-manager';

export class ConcurrentWriteError extends Error {}

export async function retryConflictingTransaction<T>(
  transactions: TransactionManager,
  work: (ctx: TransactionContext) => Promise<T>
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await transactions.run(work);
    } catch (error) {
      const retryable =
        error instanceof ConcurrentWriteError || error?.code === 'P2034';
      if (!retryable) throw error;
      if (attempt === 3) throw new ConcurrentWriteError();
    }
  }
}
