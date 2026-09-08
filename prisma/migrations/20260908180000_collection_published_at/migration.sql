-- AlterTable
ALTER TABLE "CosmeticCollection" ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- Backfill: any collection that has ever left DRAFT is treated as published
-- (its membership is now frozen). Use updatedAt as the best available stamp.
UPDATE "CosmeticCollection"
  SET "publishedAt" = "updatedAt"
  WHERE "status" IN ('PUBLISHED', 'HIDDEN', 'ARCHIVED') AND "publishedAt" IS NULL;
