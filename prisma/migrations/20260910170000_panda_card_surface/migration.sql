-- Surface artwork for the Panda overview card.
--
-- 20260910150000_panda_theme published this collection, which freezes an
-- asset's config against admin edits. That guard protects a live asset from
-- changing under the people who own it; this collection has not been granted
-- to anyone yet, so the value is added here rather than by orphaning the asset
-- and seeding a duplicate. The update is keyed to the one slug and skips any
-- row that already carries a mediaUrl, so an operator's own choice always wins.

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_05_card_surface_png', 'แพนด้า — ลายพื้นการ์ดไผ่ (ภาพใช้จริง)', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/05-card-surface.png', 'cosmetics/panda/05-card-surface.png', 'image/png', 0, 1600, 900, 'ACTIVE', 'CARD_SURFACE', now(), now())
ON CONFLICT DO NOTHING;

UPDATE "CosmeticAsset"
SET "config" = "config" || '{"mediaUrl":"https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/05-card-surface.png","texture":"NONE"}'::jsonb,
    "description" = 'การ์ดใบเด่น ปูลายไผ่จาง ๆ ที่ขอบ กลางการ์ดเว้นว่างให้ตัวเลขอ่านออก',
    "updatedAt" = now()
WHERE "slug" = 'panda-overview-card'
  AND NOT ("config" ? 'mediaUrl');
