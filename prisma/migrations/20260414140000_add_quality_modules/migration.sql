-- Migration: Migrate existing roles before enum change
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE role = 'RECEPTIONIST';
UPDATE "User" SET role = 'ADMIN' WHERE role = 'HOUSEKEEPING';
UPDATE "HotelUser" SET role = 'SUPER_ADMIN' WHERE role = 'RECEPTIONIST';
UPDATE "HotelUser" SET role = 'ADMIN' WHERE role = 'HOUSEKEEPING';

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "ActionCategory" AS ENUM ('CHAMBRE', 'PROPRETE', 'EQUIPEMENT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "EquipmentState" AS ENUM ('BON', 'DEGRADE', 'HS');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('HAUTE', 'MOYENNE', 'FAIBLE');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINE');

-- CreateEnum
CREATE TYPE "SafetyStatus" AS ENUM ('CONFORME', 'RESERVE', 'EN_COURS', 'EXPIRE');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPE_HEBERGEMENT', 'OPE_TECHNIQUE');
ALTER TABLE "HotelUser" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "HotelUser" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "HotelUser" ALTER COLUMN "role" SET DEFAULT 'OPE_HEBERGEMENT';
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPE_HEBERGEMENT';
COMMIT;

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN "city" TEXT,
ADD COLUMN "rooms_count" INTEGER,
ADD COLUMN "rpsTarget" DOUBLE PRECISION,
ADD COLUMN "trustyouId" TEXT;

-- CreateTable
CREATE TABLE "MonthlyPerf" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "rps" DOUBLE PRECISION,
    "rpsN1" DOUBLE PRECISION,
    "compIndex" DOUBLE PRECISION,
    "nbReviews" INTEGER,
    "responseRate" DOUBLE PRECISION,
    "negImpact1" TEXT,
    "negImpact2" TEXT,
    "negImpact3" TEXT,
    "posImpact1" TEXT,
    "posImpact2" TEXT,
    "posImpact3" TEXT,
    "sparkles" INTEGER,
    "animations" INTEGER,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MonthlyPerf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "category" "ActionCategory" NOT NULL,
    "score" DOUBLE PRECISION,
    "text" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "owner" TEXT NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'TODO',
    "budget" DOUBLE PRECISION,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RitualCheck" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "ritualId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RitualCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomEquipCheck" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL,
    "equipStates" JSONB NOT NULL,
    "action" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'TODO',
    "checkedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoomEquipCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonAreaCheck" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "areaName" TEXT NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL,
    "checkStates" JSONB NOT NULL,
    "action" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'TODO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommonAreaCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTicket" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zone" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MOYENNE',
    "status" "TicketStatus" NOT NULL DEFAULT 'A_FAIRE',
    "cost" DOUBLE PRECISION,
    "assignedTo" TEXT,
    "photos" TEXT[],
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaintenanceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierMaint" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "lastCheck" TIMESTAMP(3),
    "frequency" TEXT NOT NULL,
    "supplier" TEXT,
    "reserves" TEXT,
    "quotation" DOUBLE PRECISION,
    "documents" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupplierMaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyItem" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lastCheck" TIMESTAMP(3),
    "frequency" TEXT NOT NULL,
    "status" "SafetyStatus" NOT NULL DEFAULT 'EXPIRE',
    "documents" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SafetyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyCommission" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL,
    "prescriptions" JSONB NOT NULL,
    "nextVisitDate" TIMESTAMP(3),
    "pvDocument" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SafetyCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelAudit" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "auditorId" TEXT NOT NULL,
    "globalScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HotelAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelAuditItem" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "photos" TEXT[],
    CONSTRAINT "HotelAuditItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaybookCustom" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "effort" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaybookCustom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPerf_hotelId_year_month_key" ON "MonthlyPerf"("hotelId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "RitualCheck_hotelId_ritualId_weekStart_key" ON "RitualCheck"("hotelId", "ritualId", "weekStart");

-- AddForeignKey
ALTER TABLE "MonthlyPerf" ADD CONSTRAINT "MonthlyPerf_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RitualCheck" ADD CONSTRAINT "RitualCheck_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RitualCheck" ADD CONSTRAINT "RitualCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomEquipCheck" ADD CONSTRAINT "RoomEquipCheck_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommonAreaCheck" ADD CONSTRAINT "CommonAreaCheck_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMaint" ADD CONSTRAINT "SupplierMaint_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyItem" ADD CONSTRAINT "SafetyItem_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCommission" ADD CONSTRAINT "SafetyCommission_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelAudit" ADD CONSTRAINT "HotelAudit_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelAudit" ADD CONSTRAINT "HotelAudit_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelAuditItem" ADD CONSTRAINT "HotelAuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "HotelAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookCustom" ADD CONSTRAINT "PlaybookCustom_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
