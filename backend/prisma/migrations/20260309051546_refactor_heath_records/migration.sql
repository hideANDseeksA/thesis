/*
  Warnings:

  - Added the required column `bmi` to the `health_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `health_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `health_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "health_records" ADD COLUMN     "bmi" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "height" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "details" DROP NOT NULL;
