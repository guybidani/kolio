-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailDigest" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "WeeklyReport" ADD COLUMN "emailSentAt" TIMESTAMP(3);
