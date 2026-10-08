-- AlterEnum: add moderation lifecycle statuses
ALTER TYPE "AdaptationStatus" ADD VALUE 'pending_review';
ALTER TYPE "AdaptationStatus" ADD VALUE 'pending_manual_review';
ALTER TYPE "AdaptationStatus" ADD VALUE 'rejected';
ALTER TYPE "AdaptationStatus" ADD VALUE 'withdrawn';

-- CreateEnum
CREATE TYPE "ModerationAuditAction" AS ENUM ('auto_approved', 'auto_rejected', 'auto_manual_review', 'admin_approved', 'admin_rejected', 'admin_withdrawn', 'report_withdrawn');

-- CreateEnum
CREATE TYPE "ModerationActorType" AS ENUM ('system', 'admin', 'user');

-- AlterTable
ALTER TABLE "PassageAdaptation" ADD COLUMN "moderationReason" TEXT,
ADD COLUMN "moderatedAt" TIMESTAMP(3),
ADD COLUMN "reportCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AdaptationReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adaptationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdaptationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAuditLog" (
    "id" TEXT NOT NULL,
    "adaptationId" TEXT NOT NULL,
    "action" "ModerationAuditAction" NOT NULL,
    "actorType" "ModerationActorType" NOT NULL,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdaptationReport_adaptationId_idx" ON "AdaptationReport"("adaptationId");

-- CreateIndex
CREATE UNIQUE INDEX "AdaptationReport_userId_adaptationId_key" ON "AdaptationReport"("userId", "adaptationId");

-- CreateIndex
CREATE INDEX "ModerationAuditLog_adaptationId_idx" ON "ModerationAuditLog"("adaptationId");

-- CreateIndex
CREATE INDEX "ModerationAuditLog_createdAt_idx" ON "ModerationAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AdaptationReport" ADD CONSTRAINT "AdaptationReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdaptationReport" ADD CONSTRAINT "AdaptationReport_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "PassageAdaptation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAuditLog" ADD CONSTRAINT "ModerationAuditLog_adaptationId_fkey" FOREIGN KEY ("adaptationId") REFERENCES "PassageAdaptation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAuditLog" ADD CONSTRAINT "ModerationAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing community and as_default versions remain approved (no data migration needed).
