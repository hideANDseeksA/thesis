-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_resident_id_fkey";

-- DropForeignKey
ALTER TABLE "health_records" DROP CONSTRAINT "health_records_resident_id_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_resident_id_fkey";

-- DropForeignKey
ALTER TABLE "pregnancy_monitoring" DROP CONSTRAINT "pregnancy_monitoring_health_record_id_fkey";

-- DropForeignKey
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_resident_id_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_resident_id_fkey";

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancy_monitoring" ADD CONSTRAINT "pregnancy_monitoring_health_record_id_fkey" FOREIGN KEY ("health_record_id") REFERENCES "health_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
