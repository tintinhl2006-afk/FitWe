-- AlterTable
ALTER TABLE "PaymentRecord" ADD COLUMN "providerRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_providerRef_key" ON "PaymentRecord"("providerRef");
