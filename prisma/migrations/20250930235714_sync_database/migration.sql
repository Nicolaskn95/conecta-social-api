/*
  Warnings:

  - You are about to drop the column `uf` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `uf` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "uf";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "uf";

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "street" VARCHAR(60) NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "neighborhood" VARCHAR(60) NOT NULL,
    "city" VARCHAR(30) NOT NULL,
    "state" VARCHAR(20) NOT NULL,
    "cep" VARCHAR(9) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(25) NOT NULL,
    "measure_unity" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "description" VARCHAR(250),
    "initial_quantity" INTEGER NOT NULL DEFAULT 0,
    "current_quantity" INTEGER NOT NULL DEFAULT 0,
    "donator_name" VARCHAR(90),
    "gender" VARCHAR(10),
    "size" VARCHAR(20),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
