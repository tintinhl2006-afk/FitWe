-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gymCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_gymCode_key" ON "User"("gymCode");
