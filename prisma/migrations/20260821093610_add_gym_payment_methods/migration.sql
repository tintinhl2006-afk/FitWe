-- AlterTable: drop the old global gateway fields from User (replaced by GymPaymentMethod)
ALTER TABLE "User" DROP COLUMN "stripeAccountId",
DROP COLUMN "stripeConnected",
DROP COLUMN "stripeEnabled",
DROP COLUMN "redsysFuc",
DROP COLUMN "redsysTerminal",
DROP COLUMN "redsysClave",
DROP COLUMN "redsysEnabled";

-- CreateEnum
CREATE TYPE "PaymentGatewayType" AS ENUM ('STRIPE', 'REDSYS');

-- CreateTable
CREATE TABLE "GymPaymentMethod" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gymId" UUID NOT NULL,
    "gateway" "PaymentGatewayType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "stripeAccountId" TEXT,
    "stripeConnected" BOOLEAN NOT NULL DEFAULT false,
    "redsysFuc" TEXT,
    "redsysTerminal" TEXT DEFAULT '001',
    "redsysClave" TEXT,
    "billingName" TEXT NOT NULL,
    "billingDocumentType" TEXT,
    "billingDocumentNumber" TEXT,
    "billingDocumentLetter" TEXT,
    "billingPhone" TEXT,
    "billingEmail" TEXT,
    "billingAddress" TEXT,
    "billingCountry" TEXT DEFAULT 'España',
    "billingProvince" TEXT,
    "billingLocality" TEXT,
    "billingPostalCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "PaymentRecord" ADD COLUMN "paymentMethodId" UUID;

-- CreateIndex
CREATE INDEX "GymPaymentMethod_gymId_idx" ON "GymPaymentMethod"("gymId");

-- CreateIndex
CREATE INDEX "PaymentRecord_paymentMethodId_idx" ON "PaymentRecord"("paymentMethodId");

-- AddForeignKey
ALTER TABLE "GymPaymentMethod" ADD CONSTRAINT "GymPaymentMethod_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "GymPaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
