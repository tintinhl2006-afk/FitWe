-- CreateEnum
CREATE TYPE "PlanBillingType" AS ENUM ('DURATION', 'CREDITS');

-- CreateEnum
CREATE TYPE "CreditRechargeMode" AS ENUM ('PER_PAYMENT', 'PERIODIC');

-- CreateEnum
CREATE TYPE "AccessDirection" AS ENUM ('ENTRY', 'EXIT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "creditsRemaining" INTEGER,
ADD COLUMN "creditsNextRechargeAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN "billingType" "PlanBillingType" NOT NULL DEFAULT 'DURATION',
ADD COLUMN "creditsPerCycle" INTEGER,
ADD COLUMN "creditRechargeMode" "CreditRechargeMode",
ADD COLUMN "rechargeIntervalDays" INTEGER,
ADD COLUMN "creditsNeverExpire" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AccessLog" ADD COLUMN "direction" "AccessDirection" NOT NULL DEFAULT 'ENTRY';
