/*
  Warnings:

  - You are about to drop the column `assigned_officer` on the `blotter` table. All the data in the column will be lost.
  - You are about to drop the column `complaint_id` on the `blotter` table. All the data in the column will be lost.
  - You are about to drop the column `image_paths` on the `blotter` table. All the data in the column will be lost.
  - You are about to drop the column `incident_date` on the `blotter` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `blotter` table. All the data in the column will be lost.
  - You are about to drop the column `official_blotter_number` on the `blotter` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `blotter` table. All the data in the column will be lost.
  - You are about to drop the column `filed_at` on the `complaints` table. All the data in the column will be lost.
  - Added the required column `resident_id` to the `blotter` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "blotter" DROP CONSTRAINT "blotter_complaint_id_fkey";

-- DropIndex
DROP INDEX "blotter_official_blotter_number_key";

-- AlterTable
ALTER TABLE "blotter" DROP COLUMN "assigned_officer",
DROP COLUMN "complaint_id",
DROP COLUMN "image_paths",
DROP COLUMN "incident_date",
DROP COLUMN "location",
DROP COLUMN "official_blotter_number",
DROP COLUMN "remarks",
ADD COLUMN     "details" TEXT,
ADD COLUMN     "file_path" TEXT,
ADD COLUMN     "resident_id" UUID NOT NULL,
ADD COLUMN     "vertor" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "complaints" DROP COLUMN "filed_at";

-- AddForeignKey
ALTER TABLE "blotter" ADD CONSTRAINT "blotter_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
