/*
  Warnings:

  - You are about to drop the column `purok` on the `residents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "residents" DROP COLUMN "purok",
ADD COLUMN     "purok_id" UUID;

-- CreateTable
CREATE TABLE "purok" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "purok_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purok_name_key" ON "purok"("name");

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_purok_id_fkey" FOREIGN KEY ("purok_id") REFERENCES "purok"("id") ON DELETE SET NULL ON UPDATE CASCADE;
