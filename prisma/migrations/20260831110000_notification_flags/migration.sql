-- AlterTable
ALTER TABLE "User" ADD COLUMN "subscriptionExpiryReminderSentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "subscriptionExpiredNotifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ClassBooking" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
