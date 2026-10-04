import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from '@/domain/entities';
import { AuditLogRepository, CreateAuditLogData } from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';
import { AuditLogDoc } from '../schemas';
import { toEntity } from '../mappers/to-entity';
import { resolveMongoSession } from '../mongo-transaction-manager';

@Injectable()
export class AuditLogMongoRepository extends AuditLogRepository {
  constructor(
    @InjectModel(AuditLogDoc.name)
    private readonly auditLogModel: Model<AuditLogDoc>
  ) {
    super();
  }

  async create(
    data: CreateAuditLogData,
    ctx?: TransactionContext
  ): Promise<AuditLog> {
    const session = resolveMongoSession(ctx);
    const [created] = await this.auditLogModel.create([data], { session });
    return toEntity<AuditLog>(created);
  }
}
