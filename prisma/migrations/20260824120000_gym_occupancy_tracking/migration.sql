-- AlterTable
ALTER TABLE "User" ADD COLUMN "occupancyTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "occupancyAutoExitMinutes" INTEGER NOT NULL DEFAULT 90;

-- CreateIndex
CREATE INDEX "AccessLog_gymId_userId_createdAt_idx" ON "AccessLog"("gymId", "userId", "createdAt");
