/*
  Warnings:

  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_userId_fkey";

-- DropTable
DROP TABLE "events";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "surname" VARCHAR(60) NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "email" VARCHAR(60) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "password" VARCHAR(128) NOT NULL,
    "cep" VARCHAR(9) NOT NULL,
    "street" VARCHAR(100) NOT NULL,
    "neighborhood" VARCHAR(60) NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "city" VARCHAR(30) NOT NULL,
    "uf" VARCHAR(2) NOT NULL,
    "state" VARCHAR(20) NOT NULL,
    "complement" VARCHAR(30),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_key" ON "employees"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
