import { Injectable } from '@nestjs/common';
import {
  AuditActionType,
  AuditEntityType,
  Employee,
  EmployeeRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@/config/prisma/prisma.service';

interface AuditLogInput {
  entityType: AuditEntityType;
  entityId: string;
  actionType: AuditActionType;
  message: string;
  metadata?: Prisma.InputJsonValue;
  actor?: Pick<Employee, 'id' | 'role'> | null;
  tx?: Prisma.TransactionClient;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async write(input: AuditLogInput) {
    const client = input.tx ?? this.prisma;

    return client.auditLog.create({
      data: {
        entity_type: input.entityType,
        entity_id: input.entityId,
        action_type: input.actionType,
        actor_employee_id: input.actor?.id,
        actor_role: (input.actor?.role as EmployeeRole | undefined) ?? null,
        message: input.message,
        metadata: input.metadata,
      },
    });
  }
}
