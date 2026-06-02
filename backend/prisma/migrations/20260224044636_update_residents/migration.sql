/*
  Warnings:

  - A unique constraint covering the columns `[h_email_address]` on the table `residents` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "public_view" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "residents_h_email_address_key" ON "residents"("h_email_address");
