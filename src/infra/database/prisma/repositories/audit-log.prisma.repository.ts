import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditLog } from '@/domain/entities';
import { AuditLogRepository, CreateAuditLogData } from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { PrismaService } from '../prisma.service';
import { resolvePrismaClient, toDomain } from '../prisma-transaction-manager';

@Injectable()
export class AuditLogPrismaRepository extends AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(data: CreateAuditLogData, ctx?: TransactionContext): Promise<AuditLog> {
    const client = resolvePrismaClient(this.prisma, ctx);
    return toDomain(
      await client.auditLog.create({
        data: {
          ...data,
          metadata: data.metadata as Prisma.InputJsonValue | undefined,
        },
      })
    );
  }
}
