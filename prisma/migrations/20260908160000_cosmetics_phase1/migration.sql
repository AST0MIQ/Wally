-- CreateEnum
CREATE TYPE "EquipmentSlot" AS ENUM ('APP_BACKGROUND', 'NAVIGATION', 'HEADER', 'PROFILE_FRAME', 'PROFILE_BADGE', 'PROFILE_AURA', 'OVERVIEW_CARD', 'ACCOUNT_CARD', 'INVESTMENT_CARD', 'TRANSACTION_CARD', 'CHART_STYLE', 'ICON_SET', 'TYPOGRAPHY', 'AMBIENT_EFFECT', 'INTERACTION_EFFECT', 'CELEBRATION_EFFECT');

-- CreateEnum
CREATE TYPE "CosmeticRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'SPECIAL', 'LIMITED');

-- CreateEnum
CREATE TYPE "CosmeticStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AcquisitionType" AS ENUM ('DEFAULT', 'STREAK_REWARD', 'RANK_REWARD', 'ACHIEVEMENT', 'PURCHASE', 'LIMITED_EVENT', 'ADMIN_GRANT');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "RewardTrigger" AS ENUM ('STREAK_MILESTONE', 'RANK_MILESTONE', 'ACHIEVEMENT', 'MANUAL');

-- CreateTable
CREATE TABLE "CosmeticAsset" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slot" "EquipmentSlot" NOT NULL,
    "rarity" "CosmeticRarity" NOT NULL DEFAULT 'COMMON',
    "status" "CosmeticStatus" NOT NULL DEFAULT 'DRAFT',
    "acquisitionType" "AcquisitionType" NOT NULL DEFAULT 'ADMIN_GRANT',
    "isCanonicalDefault" BOOLEAN NOT NULL DEFAULT false,
    "configVersion" INTEGER NOT NULL DEFAULT 1,
    "config" JSONB NOT NULL,
    "previewUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CosmeticAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CosmeticCollection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "rarity" "CosmeticRarity" NOT NULL DEFAULT 'COMMON',
    "status" "CosmeticStatus" NOT NULL DEFAULT 'DRAFT',
    "isApplicableAsSet" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CosmeticCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionAsset" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "slot" "EquipmentSlot" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sourceCollectionId" TEXT,
    "acquisitionType" "AcquisitionType" NOT NULL,
    "sourceRef" TEXT,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstGrantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedByAdminId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedByAdminId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEquippedAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slot" "EquipmentSlot" NOT NULL,
    "assetId" TEXT NOT NULL,
    "equippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEquippedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "RewardTrigger" NOT NULL,
    "threshold" INTEGER,
    "grantsCollectionId" TEXT,
    "grantsAssetId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CosmeticAsset_slug_key" ON "CosmeticAsset"("slug");

-- CreateIndex
CREATE INDEX "CosmeticAsset_slot_status_idx" ON "CosmeticAsset"("slot", "status");

-- CreateIndex
CREATE INDEX "CosmeticAsset_status_idx" ON "CosmeticAsset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CosmeticAsset_id_slot_key" ON "CosmeticAsset"("id", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "CosmeticCollection_slug_key" ON "CosmeticCollection"("slug");

-- CreateIndex
CREATE INDEX "CosmeticCollection_status_idx" ON "CosmeticCollection"("status");

-- CreateIndex
CREATE INDEX "CosmeticCollection_rarity_idx" ON "CosmeticCollection"("rarity");

-- CreateIndex
CREATE INDEX "CollectionAsset_assetId_idx" ON "CollectionAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionAsset_collectionId_assetId_key" ON "CollectionAsset"("collectionId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionAsset_collectionId_slot_key" ON "CollectionAsset"("collectionId", "slot");

-- CreateIndex
CREATE INDEX "UserEntitlement_userId_status_idx" ON "UserEntitlement"("userId", "status");

-- CreateIndex
CREATE INDEX "UserEntitlement_assetId_idx" ON "UserEntitlement"("assetId");

-- CreateIndex
CREATE INDEX "UserEntitlement_expiresAt_idx" ON "UserEntitlement"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserEntitlement_userId_assetId_key" ON "UserEntitlement"("userId", "assetId");

-- CreateIndex
CREATE INDEX "UserEquippedAsset_assetId_idx" ON "UserEquippedAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEquippedAsset_userId_slot_key" ON "UserEquippedAsset"("userId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "RewardRule_key_key" ON "RewardRule"("key");

-- CreateIndex
CREATE INDEX "RewardRule_trigger_isActive_idx" ON "RewardRule"("trigger", "isActive");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "CosmeticAsset" ADD CONSTRAINT "CosmeticAsset_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CosmeticCollection" ADD CONSTRAINT "CosmeticCollection_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionAsset" ADD CONSTRAINT "CollectionAsset_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "CosmeticCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionAsset" ADD CONSTRAINT "CollectionAsset_assetId_slot_fkey" FOREIGN KEY ("assetId", "slot") REFERENCES "CosmeticAsset"("id", "slot") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntitlement" ADD CONSTRAINT "UserEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntitlement" ADD CONSTRAINT "UserEntitlement_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "CosmeticAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntitlement" ADD CONSTRAINT "UserEntitlement_sourceCollectionId_fkey" FOREIGN KEY ("sourceCollectionId") REFERENCES "CosmeticCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntitlement" ADD CONSTRAINT "UserEntitlement_grantedByAdminId_fkey" FOREIGN KEY ("grantedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntitlement" ADD CONSTRAINT "UserEntitlement_revokedByAdminId_fkey" FOREIGN KEY ("revokedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEquippedAsset" ADD CONSTRAINT "UserEquippedAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEquippedAsset" ADD CONSTRAINT "UserEquippedAsset_assetId_slot_fkey" FOREIGN KEY ("assetId", "slot") REFERENCES "CosmeticAsset"("id", "slot") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRule" ADD CONSTRAINT "RewardRule_grantsCollectionId_fkey" FOREIGN KEY ("grantsCollectionId") REFERENCES "CosmeticCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRule" ADD CONSTRAINT "RewardRule_grantsAssetId_fkey" FOREIGN KEY ("grantsAssetId") REFERENCES "CosmeticAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── Hand-authored constraints Prisma schema cannot express ──────────────

-- [S11] At most one canonical default cosmetic asset per equipment slot.
CREATE UNIQUE INDEX "CosmeticAsset_canonical_default_per_slot"
  ON "CosmeticAsset"("slot")
  WHERE "isCanonicalDefault";

-- [S9] A RewardRule grants exactly one target: a collection XOR an asset.
ALTER TABLE "RewardRule"
  ADD CONSTRAINT "RewardRule_exactly_one_target"
  CHECK (num_nonnulls("grantsCollectionId", "grantsAssetId") = 1);
