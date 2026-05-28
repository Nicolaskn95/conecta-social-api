-- CreateEnum
CREATE TYPE "DonationStockAdjustmentReason" AS ENUM (
  'SPOILAGE',
  'LOSS',
  'DAMAGE',
  'EXPIRATION',
  'INVENTORY_CORRECTION',
  'OTHER'
);

-- CreateTable
CREATE TABLE "donation_stock_adjustments" (
  "id" TEXT NOT NULL,
  "id_donation" TEXT NOT NULL,
  "id_employee" TEXT NOT NULL,
  "delta_quantity" INTEGER NOT NULL,
  "previous_quantity" INTEGER NOT NULL,
  "new_quantity" INTEGER NOT NULL,
  "reason" "DonationStockAdjustmentReason" NOT NULL,
  "note" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "donation_stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "donation_stock_adjustments_id_donation_created_at_idx"
ON "donation_stock_adjustments"("id_donation", "created_at");

-- CreateIndex
CREATE INDEX "donation_stock_adjustments_id_employee_created_at_idx"
ON "donation_stock_adjustments"("id_employee", "created_at");

-- AddForeignKey
ALTER TABLE "donation_stock_adjustments"
ADD CONSTRAINT "donation_stock_adjustments_id_donation_fkey"
FOREIGN KEY ("id_donation") REFERENCES "donations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_stock_adjustments"
ADD CONSTRAINT "donation_stock_adjustments_id_employee_fkey"
FOREIGN KEY ("id_employee") REFERENCES "employees"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
