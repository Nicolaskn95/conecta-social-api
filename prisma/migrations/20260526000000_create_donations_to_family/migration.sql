-- CreateTable
CREATE TABLE "donations_to_family" (
    "id" TEXT NOT NULL,
    "id_donation" TEXT NOT NULL,
    "id_family" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "update_message" VARCHAR(250),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "donations_to_family_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "donations_to_family_id_donation_idx" ON "donations_to_family"("id_donation");

-- CreateIndex
CREATE INDEX "donations_to_family_id_family_idx" ON "donations_to_family"("id_family");

-- AddForeignKey
ALTER TABLE "donations_to_family"
ADD CONSTRAINT "donations_to_family_id_donation_fkey"
FOREIGN KEY ("id_donation") REFERENCES "donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations_to_family"
ADD CONSTRAINT "donations_to_family_id_family_fkey"
FOREIGN KEY ("id_family") REFERENCES "families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
