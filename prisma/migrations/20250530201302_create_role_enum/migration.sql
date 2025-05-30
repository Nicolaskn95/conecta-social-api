/*
  Warnings:

  - The `role` column on the `employees` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('ADMIN', 'MANAGER', 'VOLUNTEER');

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "role",
ADD COLUMN     "role" "EmployeeRole" NOT NULL DEFAULT 'VOLUNTEER';
