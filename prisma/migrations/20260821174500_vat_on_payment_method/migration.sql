-- AlterTable
ALTER TABLE "GymPaymentMethod" ADD COLUMN "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 21;

-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "vatRate";
