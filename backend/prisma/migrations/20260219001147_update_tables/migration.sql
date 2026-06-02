-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "handler" UUID;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_handler_fkey" FOREIGN KEY ("handler") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
