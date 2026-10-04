-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'BENEFICIARY';

-- CreateTable
CREATE TABLE "beneficiaries" (
  "id" TEXT NOT NULL,
  "id_family" TEXT NOT NULL,
  "name" VARCHAR(30) NOT NULL,
  "surname" VARCHAR(60) NOT NULL,
  "birth_date" TIMESTAMP(3) NOT NULL,
  "cpf" VARCHAR(11),
  "rg" VARCHAR(15),
  "email" VARCHAR(60),
  "phone" VARCHAR(15),
  "has_disability" BOOLEAN NOT NULL DEFAULT false,
  "disability_details" VARCHAR(90),
  "gender" VARCHAR(30) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beneficiaries_cpf_key" ON "beneficiaries"("cpf");

-- CreateIndex
CREATE INDEX "beneficiaries_id_family_idx" ON "beneficiaries"("id_family");

-- CreateIndex
CREATE INDEX "beneficiaries_active_idx" ON "beneficiaries"("active");

-- CreateIndex
CREATE INDEX "beneficiaries_has_disability_idx" ON "beneficiaries"("has_disability");

-- AddForeignKey
ALTER TABLE "beneficiaries"
ADD CONSTRAINT "beneficiaries_id_family_fkey"
FOREIGN KEY ("id_family") REFERENCES "families"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
