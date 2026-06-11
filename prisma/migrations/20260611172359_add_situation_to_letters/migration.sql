-- AlterTable
ALTER TABLE "letters" ADD COLUMN     "partyDetails" JSONB,
ADD COLUMN     "situation" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "lsCustomerId" TEXT,
ADD COLUMN     "variantId" TEXT;

-- CreateIndex
CREATE INDEX "email_events_letterId_idx" ON "email_events"("letterId");

-- CreateIndex
CREATE INDEX "letters_documentId_idx" ON "letters"("documentId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");
