/*
  Warnings:

  - You are about to drop the column `for` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `checkup_notes` on the `pregnancy_monitoring` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notification" DROP COLUMN "for",
ADD COLUMN     "receiver" "Role";

-- AlterTable
ALTER TABLE "pregnancy_monitoring" DROP COLUMN "checkup_notes",
ADD COLUMN     "details" TEXT;
