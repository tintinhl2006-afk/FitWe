-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('ONLINE', 'CASH');

-- AlterTable
ALTER TABLE "PaymentRecord" ADD COLUMN "source" "PaymentSource" NOT NULL DEFAULT 'ONLINE';
