-- AlterEnum: Add new CallSource values
ALTER TYPE "CallSource" ADD VALUE IF NOT EXISTS 'EMAIL_IMPORT';
ALTER TYPE "CallSource" ADD VALUE IF NOT EXISTS 'FTP_IMPORT';
ALTER TYPE "CallSource" ADD VALUE IF NOT EXISTS 'API_IMPORT';

-- AlterTable: Add importConfig and apiKey to Organization
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "importConfig" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "apiKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_apiKey_key" ON "Organization"("apiKey");
