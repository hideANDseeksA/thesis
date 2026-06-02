/*
  Warnings:

  - You are about to drop the column `vector` on the `blotter` table. All the data in the column will be lost.
  - You are about to drop the column `expiration_date` on the `documents` table. All the data in the column will be lost.

*/
-- AlterTable

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "blotter" DROP COLUMN "vector",
ADD COLUMN     "embeddings" vector(384);

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "expiration_date";
