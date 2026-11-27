-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "DonationCondition" AS ENUM ('NEW', 'USED_GOOD', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "NeedStatus" AS ENUM ('OPEN', 'FULFILLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DonationAllocationStatus" AS ENUM ('UNKNOWN', 'WAITING_RECEIPT', 'COMPLETED', 'CANCELED');

-- AlterTable
ALTER TABLE "families" ADD COLUMN     "housing_description" VARCHAR(250),
ADD COLUMN     "monthly_income_cents" INTEGER,
ADD COLUMN     "preferred_delivery_mode" "DeliveryMode";

-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "condition" "DonationCondition",
ADD COLUMN     "item_type_id" TEXT,
ADD COLUMN     "specifications" JSONB;

-- AlterTable
ALTER TABLE "donations_to_family" ADD COLUMN     "canceled_at" TIMESTAMP(3),
ADD COLUMN     "canceled_by" TEXT,
ADD COLUMN     "confirmed_at" TIMESTAMP(3),
ADD COLUMN     "confirmed_by" TEXT,
ADD COLUMN     "delivery_mode" "DeliveryMode",
ADD COLUMN     "id_beneficiary" TEXT,
ADD COLUMN     "id_need" TEXT,
ADD COLUMN     "received_at" TIMESTAMP(3),
ADD COLUMN     "request_id" TEXT,
ADD COLUMN     "separated_at" TIMESTAMP(3),
ADD COLUMN     "separated_by" TEXT,
ADD COLUMN     "status" "DonationAllocationStatus" NOT NULL DEFAULT 'UNKNOWN';

-- CreateTable
CREATE TABLE "item_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "needs" (
    "id" TEXT NOT NULL,
    "id_family" TEXT NOT NULL,
    "id_beneficiary" TEXT,
    "item_type_id" TEXT,
    "description" VARCHAR(500),
    "requested_quantity" INTEGER,
    "specifications" JSONB,
    "status" "NeedStatus" NOT NULL DEFAULT 'OPEN',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "needs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_types_code_key" ON "item_types"("code");

-- CreateIndex
CREATE INDEX "item_types_category_id_active_idx" ON "item_types"("category_id", "active");

-- CreateIndex
CREATE INDEX "needs_id_family_status_created_at_idx" ON "needs"("id_family", "status", "created_at");

-- CreateIndex
CREATE INDEX "needs_id_beneficiary_status_created_at_idx" ON "needs"("id_beneficiary", "status", "created_at");

-- CreateIndex
CREATE INDEX "needs_status_item_type_id_created_at_idx" ON "needs"("status", "item_type_id", "created_at");

-- CreateIndex
CREATE INDEX "needs_item_type_id_idx" ON "needs"("item_type_id");

-- CreateIndex
CREATE INDEX "donations_item_type_id_idx" ON "donations"("item_type_id");

-- CreateIndex
CREATE INDEX "donations_to_family_id_beneficiary_idx" ON "donations_to_family"("id_beneficiary");

-- CreateIndex
CREATE INDEX "donations_to_family_id_need_status_idx" ON "donations_to_family"("id_need", "status");

-- CreateIndex
CREATE INDEX "donations_to_family_status_separated_at_idx" ON "donations_to_family"("status", "separated_at");

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations_to_family" ADD CONSTRAINT "donations_to_family_id_beneficiary_fkey" FOREIGN KEY ("id_beneficiary") REFERENCES "beneficiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations_to_family" ADD CONSTRAINT "donations_to_family_id_need_fkey" FOREIGN KEY ("id_need") REFERENCES "needs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations_to_family" ADD CONSTRAINT "donations_to_family_separated_by_fkey" FOREIGN KEY ("separated_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations_to_family" ADD CONSTRAINT "donations_to_family_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations_to_family" ADD CONSTRAINT "donations_to_family_canceled_by_fkey" FOREIGN KEY ("canceled_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_id_family_fkey" FOREIGN KEY ("id_family") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_id_beneficiary_fkey" FOREIGN KEY ("id_beneficiary") REFERENCES "beneficiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;


CREATE UNIQUE INDEX "donations_to_family_request_id_key" ON "donations_to_family"("request_id") WHERE "request_id" IS NOT NULL;
ALTER TABLE "families" ADD CONSTRAINT "families_income_nonnegative" CHECK ("monthly_income_cents" >= 0);
ALTER TABLE "needs" ADD CONSTRAINT "needs_quantity_positive" CHECK ("requested_quantity" > 0);
