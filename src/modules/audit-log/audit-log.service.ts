import { Injectable } from '@nestjs/common';
import { AuditActionType, AuditEntityType, EmployeeRole } from '@/domain/enums';
import { Employee, JsonValue } from '@/domain/entities';
import { AuditLogRepository } from '@/domain/repositories';
import { TransactionContext } from '@/domain/transaction/transaction-manager';

export interface AuditLogInput {
  entityType: AuditEntityType;
  entityId: string;
  actionType: AuditActionType;
  message: string;
  metadata?: JsonValue;
  actor?: Pick<Employee, 'id' | 'role'> | null;
  ctx?: TransactionContext;
  tx?: any; // Compatibilidade com código legado que passa tx
}

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async write(input: AuditLogInput) {
    const ctx = input.ctx ?? (input.tx ? (input.tx as any) : undefined);

    return this.auditLogRepository.create(
      {
        entity_type: input.entityType,
        entity_id: input.entityId,
        action_type: input.actionType,
        actor_employee_id: input.actor?.id,
        actor_role: (input.actor?.role as EmployeeRole | undefined) ?? null,
        message: input.message,
        metadata: input.metadata,
      },
      ctx
    );
  }
}
