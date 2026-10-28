-- Exercises created by members used to be written into one catalog shared by every gym, visible to
-- everyone and impossible to attribute or remove. Add an optional owner: NULL keeps meaning "part of
-- the shared catalog", so every existing row is unchanged. Purely additive.

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN "userId" UUID;

-- CreateIndex
CREATE INDEX "Exercise_userId_idx" ON "Exercise"("userId");

-- AddForeignKey
-- SET NULL (not CASCADE): a routine or workout set elsewhere may still reference the exercise, and
-- deleting it would be refused by their own foreign keys.
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
