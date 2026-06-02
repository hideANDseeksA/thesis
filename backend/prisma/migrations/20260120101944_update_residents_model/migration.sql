/*
  Warnings:

  - The `b_date` column on the `residents` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "residents" DROP COLUMN "b_date",
ADD COLUMN     "b_date" DATE;
