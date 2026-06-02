/*
  Warnings:

  - You are about to drop the column `allergies` on the `health_records` table. All the data in the column will be lost.
  - You are about to drop the column `blood_type` on the `health_records` table. All the data in the column will be lost.
  - You are about to drop the column `chronic_conditions` on the `health_records` table. All the data in the column will be lost.
  - You are about to drop the column `height_cm` on the `health_records` table. All the data in the column will be lost.
  - You are about to drop the column `last_checkup` on the `health_records` table. All the data in the column will be lost.
  - You are about to drop the column `vaccination_status` on the `health_records` table. All the data in the column will be lost.
  - You are about to drop the column `weight_kg` on the `health_records` table. All the data in the column will be lost.
  - You are about to drop the `health_appointments` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `details` to the `health_records` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Civil" AS ENUM ('single', 'married', 'widow', 'seperated', 'annulled', 'co_habitation');

-- CreateEnum
CREATE TYPE "Emp_Status" AS ENUM ('student', 'employed', 'retired', 'unemployed', 'unknown');

-- CreateEnum
CREATE TYPE "E_attainment" AS ENUM ('none', 'elementary', 'highschool', 'vocational', 'college', 'postgraduate');

-- DropForeignKey
ALTER TABLE "health_appointments" DROP CONSTRAINT "health_appointments_resident_id_fkey";

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "template_requirements" TEXT;

-- AlterTable
ALTER TABLE "health_records" DROP COLUMN "allergies",
DROP COLUMN "blood_type",
DROP COLUMN "chronic_conditions",
DROP COLUMN "height_cm",
DROP COLUMN "last_checkup",
DROP COLUMN "vaccination_status",
DROP COLUMN "weight_kg",
ADD COLUMN     "details" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "for" "Role";

-- AlterTable
ALTER TABLE "residents" ADD COLUMN     "blood_type" TEXT,
ADD COLUMN     "civil_status" "Civil",
ADD COLUMN     "education" "E_attainment",
ADD COLUMN     "emp_status" "Emp_Status";

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "appointment_date" TIMESTAMP(3);

-- DropTable
DROP TABLE "health_appointments";

-- CreateTable
CREATE TABLE "health_referals" (
    "id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_referals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "health_referals" ADD CONSTRAINT "health_referals_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
