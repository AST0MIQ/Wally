ALTER TABLE "FinanceAccount" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "FinanceAccount_userId_status_sortOrder_idx" ON "FinanceAccount"("userId", "status", "sortOrder");
DROP INDEX "FinanceAccount_userId_status_idx";
