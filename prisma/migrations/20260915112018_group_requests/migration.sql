-- CreateEnum
CREATE TYPE "GroupRequestStatus" AS ENUM ('OFFEN', 'ANGENOMMEN', 'ABGELEHNT');

-- CreateTable
CREATE TABLE "group_requests" (
    "id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "partySize" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "note" TEXT,
    "status" "GroupRequestStatus" NOT NULL DEFAULT 'OFFEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_requests_status_start_idx" ON "group_requests"("status", "start");
