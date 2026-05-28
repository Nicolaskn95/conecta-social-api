-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM (
  'DONATION',
  'DONATION_TO_FAMILY',
  'FAMILY',
  'EVENT'
);

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM (
  'CREATE',
  'UPDATE',
  'SOFT_DELETE',
  'STOCK_ADJUSTMENT',
  'ALLOCATE_TO_FAMILY',
  'UPDATE_STATUS',
  'UPDATE_ATTENDANCE',
  'UPDATE_INSTAGRAM'
);

-- CreateTable
CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "entity_type" "AuditEntityType" NOT NULL,
  "entity_id" VARCHAR(64) NOT NULL,
  "action_type" "AuditActionType" NOT NULL,
  "actor_employee_id" TEXT,
  "actor_role" "EmployeeRole",
  "message" VARCHAR(250) NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx"
ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_employee_id_created_at_idx"
ON "audit_logs"("actor_employee_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx"
ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_actor_employee_id_fkey"
FOREIGN KEY ("actor_employee_id") REFERENCES "employees"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
