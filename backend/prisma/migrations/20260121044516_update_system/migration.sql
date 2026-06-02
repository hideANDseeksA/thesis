-- AlterTable
ALTER TABLE "system_setting" ADD COLUMN     "residentNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "residentNumberLength" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "residentNumberType" TEXT NOT NULL DEFAULT 'sequential',
ADD COLUMN     "residentPrefix" TEXT NOT NULL DEFAULT 'T';
