-- Cosmetics Phase 2: media, rewards ledger/rank, commerce and runtime config.
CREATE TYPE "MediaStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED');

CREATE TABLE "RewardGrant" (
  "id" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RewardGrant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RewardGrant_ruleId_userId_key" ON "RewardGrant"("ruleId", "userId");
CREATE INDEX "RewardGrant_userId_grantedAt_idx" ON "RewardGrant"("userId", "grantedAt");

CREATE TABLE "UserRank" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "points" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserRank_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserRank_userId_key" ON "UserRank"("userId");

CREATE TABLE "CosmeticMedia" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "pathname" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "status" "MediaStatus" NOT NULL DEFAULT 'ACTIVE',
  "uploadedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CosmeticMedia_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CosmeticMedia_url_key" ON "CosmeticMedia"("url");
CREATE UNIQUE INDEX "CosmeticMedia_pathname_key" ON "CosmeticMedia"("pathname");
CREATE INDEX "CosmeticMedia_status_createdAt_idx" ON "CosmeticMedia"("status", "createdAt");

CREATE TABLE "CosmeticProduct" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'THB',
  "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "grantsCollectionId" TEXT,
  "grantsAssetId" TEXT,
  "stripeProductId" TEXT,
  "stripePriceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CosmeticProduct_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CosmeticProduct_one_target_check" CHECK (("grantsCollectionId" IS NOT NULL) <> ("grantsAssetId" IS NOT NULL))
);
CREATE UNIQUE INDEX "CosmeticProduct_slug_key" ON "CosmeticProduct"("slug");
CREATE UNIQUE INDEX "CosmeticProduct_stripeProductId_key" ON "CosmeticProduct"("stripeProductId");
CREATE UNIQUE INDEX "CosmeticProduct_stripePriceId_key" ON "CosmeticProduct"("stripePriceId");
CREATE INDEX "CosmeticProduct_status_idx" ON "CosmeticProduct"("status");

CREATE TABLE "CosmeticOrder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "stripeSessionId" TEXT,
  "stripePaymentId" TEXT,
  "fulfilledAt" TIMESTAMP(3),
  "fulfilledById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CosmeticOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CosmeticOrder_stripeSessionId_key" ON "CosmeticOrder"("stripeSessionId");
CREATE INDEX "CosmeticOrder_userId_createdAt_idx" ON "CosmeticOrder"("userId", "createdAt");
CREATE INDEX "CosmeticOrder_status_createdAt_idx" ON "CosmeticOrder"("status", "createdAt");

CREATE TABLE "FeatureFlag" (
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "AppSetting" (
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "value" JSONB NOT NULL,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "RewardGrant" ADD CONSTRAINT "RewardGrant_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RewardRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RewardGrant" ADD CONSTRAINT "RewardGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserRank" ADD CONSTRAINT "UserRank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CosmeticMedia" ADD CONSTRAINT "CosmeticMedia_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CosmeticProduct" ADD CONSTRAINT "CosmeticProduct_grantsCollectionId_fkey" FOREIGN KEY ("grantsCollectionId") REFERENCES "CosmeticCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CosmeticProduct" ADD CONSTRAINT "CosmeticProduct_grantsAssetId_fkey" FOREIGN KEY ("grantsAssetId") REFERENCES "CosmeticAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CosmeticOrder" ADD CONSTRAINT "CosmeticOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CosmeticOrder" ADD CONSTRAINT "CosmeticOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CosmeticProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CosmeticOrder" ADD CONSTRAINT "CosmeticOrder_fulfilledById_fkey" FOREIGN KEY ("fulfilledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppSetting" ADD CONSTRAINT "AppSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
