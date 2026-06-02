/*
  Warnings:

  - A unique constraint covering the columns `[resident_id]` on the table `health_records` will be added. If there are existing duplicate values, this will fail.
  - Made the column `health_record_id` on table `pregnancy_monitoring` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "pregnancy_monitoring" DROP CONSTRAINT "pregnancy_monitoring_health_record_id_fkey";

-- AlterTable
ALTER TABLE "pregnancy_monitoring" ALTER COLUMN "health_record_id" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "health_records_resident_id_key" ON "health_records"("resident_id");

-- AddForeignKey
ALTER TABLE "pregnancy_monitoring" ADD CONSTRAINT "pregnancy_monitoring_health_record_id_fkey" FOREIGN KEY ("health_record_id") REFERENCES "health_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
