/**
 * Enums de domínio, independentes de banco.
 * Os valores são idênticos aos enums do Prisma (prisma/schema.prisma) para
 * manter compatibilidade com dados existentes e com o contrato da API.
 */

export enum EmployeeRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VOLUNTEER = 'VOLUNTEER',
}

export enum EventStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum DonationStockAdjustmentReason {
  SPOILAGE = 'SPOILAGE',
  LOSS = 'LOSS',
  DAMAGE = 'DAMAGE',
  EXPIRATION = 'EXPIRATION',
  INVENTORY_CORRECTION = 'INVENTORY_CORRECTION',
  OTHER = 'OTHER',
}

export enum AuditEntityType {
  DONATION = 'DONATION',
  DONATION_TO_FAMILY = 'DONATION_TO_FAMILY',
  FAMILY = 'FAMILY',
  EVENT = 'EVENT',
}

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  SOFT_DELETE = 'SOFT_DELETE',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  ALLOCATE_TO_FAMILY = 'ALLOCATE_TO_FAMILY',
  UPDATE_STATUS = 'UPDATE_STATUS',
  UPDATE_ATTENDANCE = 'UPDATE_ATTENDANCE',
  UPDATE_INSTAGRAM = 'UPDATE_INSTAGRAM',
}
