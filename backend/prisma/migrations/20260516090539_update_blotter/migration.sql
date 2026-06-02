/*
  Warnings:

  - You are about to drop the column `h_resident` on the `blotter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blotter" DROP COLUMN "h_resident",
ADD COLUMN     "type_case" TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "complaints" ALTER COLUMN "updated_at" DROP DEFAULT;
