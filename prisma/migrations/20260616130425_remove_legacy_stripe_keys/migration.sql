/*
  Warnings:

  - You are about to drop the column `stripePublishableKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSecretKey` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "stripePublishableKey",
DROP COLUMN "stripeSecretKey",
ALTER COLUMN "country" SET DEFAULT 'España';
