/*
  Warnings:

  - Made the column `l_name` on table `residents` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "residents" ADD COLUMN     "md_name" TEXT,
ALTER COLUMN "l_name" SET NOT NULL;
