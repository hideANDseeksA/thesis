/*
  Warnings:

  - The `sex` column on the `residents` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('Male', 'Female');

-- AlterTable
ALTER TABLE "residents" DROP COLUMN "sex",
ADD COLUMN     "sex" "Sex" NOT NULL DEFAULT 'Male';
