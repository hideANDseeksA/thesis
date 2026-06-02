/*
  Warnings:

  - You are about to drop the column `vertor` on the `blotter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blotter" DROP COLUMN "vertor",
ADD COLUMN     "h_resident" TEXT,
ADD COLUMN     "vector" TEXT;

-- AlterTable
ALTER TABLE "residents" ADD COLUMN     "h_contact_no" TEXT,
ADD COLUMN     "h_email_address" TEXT,
ADD COLUMN     "h_l_name" TEXT;
