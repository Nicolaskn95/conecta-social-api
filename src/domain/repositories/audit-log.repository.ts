import { AuditLog, JsonValue } from '../entities';
import { AuditActionType, AuditEntityType, EmployeeRole } from '../enums';
import { TransactionContext } from '../transaction/transaction-manager';

export interface CreateAuditLogData {
  entity_type: AuditEntityType;
  entity_id: string;
  action_type: AuditActionType;
  actor_employee_id?: string | null;
  actor_role?: EmployeeRole | null;
  message: string;
  metadata?: JsonValue;
}

export abstract class AuditLogRepository {
  abstract create(data: CreateAuditLogData, ctx?: TransactionContext): Promise<AuditLog>;
}
