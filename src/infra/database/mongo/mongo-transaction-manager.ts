import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import {
  TransactionContext,
  TransactionManager,
} from '@/domain/transaction/transaction-manager';

export class MongoTransactionContext implements TransactionContext {
  readonly __transactionContext = true as const;
  constructor(readonly session: ClientSession) {}
}

export function resolveMongoSession(
  ctx?: TransactionContext
): ClientSession | undefined {
  return ctx instanceof MongoTransactionContext ? ctx.session : undefined;
}

@Injectable()
export class MongoTransactionManager extends TransactionManager {
  constructor(
    @InjectConnection()
    private readonly connection: Connection
  ) {
    super();
  }

  async run<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await work(new MongoTransactionContext(session));
      });
      return result!;
    } finally {
      await session.endSession();
    }
  }
}
