ALTER TYPE "AuditEntityType" ADD VALUE 'NEED';

ALTER TABLE "beneficiaries" ADD COLUMN "needs_revision" INTEGER NOT NULL DEFAULT 0;
