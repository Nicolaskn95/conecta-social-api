/*
  Warnings:

  - You are about to drop the column `date` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `events` table. All the data in the column will be lost.
  - Added the required column `address` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cep` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `embedPostInstagram` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventDate` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "date",
DROP COLUMN "location",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "cep" TEXT NOT NULL,
ADD COLUMN     "embedPostInstagram" TEXT NOT NULL,
ADD COLUMN     "eventDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "number" INTEGER NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL;
