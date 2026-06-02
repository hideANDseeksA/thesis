/*
  Warnings:

  - The `status` column on the `pregnancy_monitoring` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `system_setting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `system_setting` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "P_status" AS ENUM ('ongoing', 'delivered');

-- AlterTable
ALTER TABLE "pregnancy_monitoring" DROP COLUMN "status",
ADD COLUMN     "status" "P_status" NOT NULL DEFAULT 'ongoing';

-- AlterTable
ALTER TABLE "system_setting" DROP CONSTRAINT "system_setting_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" INTEGER NOT NULL DEFAULT 1,
ADD CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id");
