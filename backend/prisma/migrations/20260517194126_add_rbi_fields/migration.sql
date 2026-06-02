/*
  Warnings:

  - You are about to drop the column `h_contact_no` on the `residents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "residents" DROP COLUMN "h_contact_no",
ADD COLUMN     "citizenship" TEXT,
ADD COLUMN     "h_full_name" TEXT,
ADD COLUMN     "occupation" TEXT;
