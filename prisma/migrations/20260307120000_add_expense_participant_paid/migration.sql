-- AlterTable
ALTER TABLE "ExpenseParticipant" ADD COLUMN IF NOT EXISTS "paid" BOOLEAN NOT NULL DEFAULT false;
