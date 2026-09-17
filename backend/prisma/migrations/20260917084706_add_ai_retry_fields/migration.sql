-- AlterTable
ALTER TABLE "News" ADD COLUMN     "aiFailed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiRetryCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "News_aiFailed_idx" ON "News"("aiFailed");
