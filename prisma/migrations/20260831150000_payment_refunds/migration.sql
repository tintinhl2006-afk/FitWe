-- AlterTable
ALTER TABLE "PaymentRecord" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "PaymentRecord" ADD COLUMN "refundReason" TEXT;
