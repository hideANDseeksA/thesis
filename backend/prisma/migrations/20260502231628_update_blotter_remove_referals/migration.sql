/*
  Warnings:

  - You are about to drop the column `embeddings` on the `blotter` table. All the data in the column will be lost.
  - You are about to drop the `health_referals` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[case_no]` on the table `blotter` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "health_referals" DROP CONSTRAINT "health_referals_resident_id_fkey";

-- AlterTable
ALTER TABLE "blotter" DROP COLUMN "embeddings",
ADD COLUMN     "case_no" TEXT;

-- DropTable
DROP TABLE "health_referals";

-- CreateIndex
CREATE UNIQUE INDEX "blotter_case_no_key" ON "blotter"("case_no");
