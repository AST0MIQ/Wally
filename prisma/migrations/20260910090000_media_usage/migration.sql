-- Tag every library image with the surface it is meant for, so the pickers can
-- offer only the images that will actually render there.
CREATE TYPE "MediaUsage" AS ENUM ('APP_BACKGROUND', 'AMBIENT_EFFECT', 'ASSET_PREVIEW', 'COLLECTION_COVER');

-- Existing rows predate the field; every one of them was uploaded for the app
-- background (the only slot that consumed media until now).
ALTER TABLE "CosmeticMedia" ADD COLUMN "usage" "MediaUsage" NOT NULL DEFAULT 'APP_BACKGROUND';

CREATE INDEX "CosmeticMedia_usage_status_createdAt_idx" ON "CosmeticMedia"("usage", "status", "createdAt");
