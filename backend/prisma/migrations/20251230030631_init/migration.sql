-- CreateEnum
CREATE TYPE "Role" AS ENUM ('resident', 'staff', 'healthworker');

-- CreateTable
CREATE TABLE "system_setting" (
    "id" UUID NOT NULL,
    "logo_url" TEXT NOT NULL,
    "web_name" TEXT,
    "web_color" TEXT,
    "barangay_status" TEXT,
    "id_pattern" TEXT,

    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residents" (
    "id" UUID NOT NULL,
    "resident_id" TEXT NOT NULL,
    "f_name" TEXT NOT NULL,
    "m_name" TEXT,
    "l_name" TEXT,
    "s_name" TEXT,
    "purok" TEXT,
    "house_no" TEXT,
    "sex" TEXT,
    "b_date" TEXT,
    "b_place" TEXT,
    "voting_status" TEXT,
    "sector" TEXT,
    "remarks" TEXT,
    "times_tamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_address" TEXT,
    "contact_no" TEXT,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "complaint_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "filed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "image_paths" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blotter" (
    "id" UUID NOT NULL,
    "complaint_id" UUID,
    "official_blotter_number" TEXT NOT NULL,
    "incident_date" DATE NOT NULL,
    "location" TEXT,
    "assigned_officer" TEXT,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "image_paths" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blotter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "template_name" TEXT NOT NULL,
    "template_price" DOUBLE PRECISION,
    "template_path" TEXT,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestType" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "document_type_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT,
    "issued_date" DATE,
    "expiration_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_appointments" (
    "id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "blood_pressure" TEXT NOT NULL,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_records" (
    "id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "height_cm" DECIMAL(65,30),
    "weight_kg" DECIMAL(65,30),
    "blood_type" TEXT,
    "allergies" TEXT,
    "chronic_conditions" TEXT,
    "last_checkup" DATE,
    "vaccination_status" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pregnancy_monitoring" (
    "id" UUID NOT NULL,
    "health_record_id" UUID,
    "pregnancy_start_date" DATE NOT NULL,
    "expected_delivery_date" DATE NOT NULL,
    "current_trimester" INTEGER,
    "complications" TEXT,
    "checkup_notes" TEXT,
    "last_checkup" DATE,
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pregnancy_monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "content" TEXT,
    "mark_read" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIME,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "certificate_id" UUID NOT NULL,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "resident_id" UUID NOT NULL,
    "password" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'resident',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "residents_resident_id_key" ON "residents"("resident_id");

-- CreateIndex
CREATE UNIQUE INDEX "blotter_official_blotter_number_key" ON "blotter"("official_blotter_number");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_resident_id_key" ON "user"("resident_id");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blotter" ADD CONSTRAINT "blotter_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_appointments" ADD CONSTRAINT "health_appointments_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancy_monitoring" ADD CONSTRAINT "pregnancy_monitoring_health_record_id_fkey" FOREIGN KEY ("health_record_id") REFERENCES "health_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
