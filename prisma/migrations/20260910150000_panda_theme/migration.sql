-- The "แพนด้า" (Panda) collection, as data rather than schema.
--
-- Generated from prisma/data/cosmetics-panda.ts. Every statement is
-- ON CONFLICT DO NOTHING and the join rows resolve ids by slug, so this is a
-- no-op on a database that already holds the collection and never overwrites
-- an operator's later edits.
--
-- Three of its assets carry artwork the renderer paints directly: the app
-- background, and the avatar frame and badge, whose transparent PNGs stand in
-- for the CSS ring and dot.

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_01_background_png', 'แพนด้า — พื้นหลังแอป', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/01-background.png', 'cosmetics/panda/01-background.png', 'image/png', 0, 752, 1344, 'ACTIVE', 'APP_BACKGROUND', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_02_profile_frame_png', 'แพนด้า — กรอบไผ่ (ภาพใช้จริง)', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/02-profile-frame.png', 'cosmetics/panda/02-profile-frame.png', 'image/png', 0, 1024, 1024, 'ACTIVE', 'PROFILE_FRAME', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_03_cover_png', 'แพนด้า — ปกชุดธีม', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/03-cover.png', 'cosmetics/panda/03-cover.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'COLLECTION_COVER', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_04_profile_badge_png', 'แพนด้า — ป้ายหน้าแพนด้า (ภาพใช้จริง)', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/04-profile-badge.png', 'cosmetics/panda/04-profile-badge.png', 'image/png', 0, 1024, 1024, 'ACTIVE', 'PROFILE_BADGE', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_app_background_png', 'แพนด้า — ตัวอย่างพื้นหลังแอป', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-app-background.png', 'cosmetics/panda/p-app-background.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_ambient_effect_png', 'แพนด้า — ตัวอย่างเอฟเฟกต์พื้นหลัง', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-ambient-effect.png', 'cosmetics/panda/p-ambient-effect.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_navigation_png', 'แพนด้า — ตัวอย่างแถบเมนู', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-navigation.png', 'cosmetics/panda/p-navigation.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_header_png', 'แพนด้า — ตัวอย่างแถบด้านบน', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-header.png', 'cosmetics/panda/p-header.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_overview_card_png', 'แพนด้า — ตัวอย่างการ์ดภาพรวม', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-overview-card.png', 'cosmetics/panda/p-overview-card.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_account_card_png', 'แพนด้า — ตัวอย่างการ์ดบัญชี', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-account-card.png', 'cosmetics/panda/p-account-card.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_investment_card_png', 'แพนด้า — ตัวอย่างการ์ดการลงทุน', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-investment-card.png', 'cosmetics/panda/p-investment-card.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_transaction_card_png', 'แพนด้า — ตัวอย่างรายการรับจ่าย', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-transaction-card.png', 'cosmetics/panda/p-transaction-card.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_profile_frame_png', 'แพนด้า — ตัวอย่างกรอบโปรไฟล์', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-profile-frame.png', 'cosmetics/panda/p-profile-frame.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_profile_badge_png', 'แพนด้า — ตัวอย่างป้ายโปรไฟล์', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-profile-badge.png', 'cosmetics/panda/p-profile-badge.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_profile_aura_png', 'แพนด้า — ตัวอย่างแสงรอบโปรไฟล์', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-profile-aura.png', 'cosmetics/panda/p-profile-aura.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_chart_style_png', 'แพนด้า — ตัวอย่างรูปแบบกราฟ', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-chart-style.png', 'cosmetics/panda/p-chart-style.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_icon_set_png', 'แพนด้า — ตัวอย่างชุดไอคอน', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-icon-set.png', 'cosmetics/panda/p-icon-set.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_interaction_effect_png', 'แพนด้า — ตัวอย่างเอฟเฟกต์ตอนกด', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-interaction-effect.png', 'cosmetics/panda/p-interaction-effect.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('pd_media_p_celebration_effect_png', 'แพนด้า — ตัวอย่างเอฟเฟกต์ฉลอง', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-celebration-effect.png', 'cosmetics/panda/p-celebration-effect.png', 'image/png', 0, 1280, 720, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticCollection" ("id", "slug", "name", "description", "coverUrl", "rarity", "status", "isApplicableAsSet", "sortOrder", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_collection', 'panda', 'แพนด้า', 'ธีมสว่างโทนกระดาษสา ถ่าน และไผ่ — กรอบและป้ายโปรไฟล์เป็นภาพจริง', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/03-cover.png', 'SPECIAL', 'PUBLISHED', true, 1, now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_app_background', 'panda-app-background', 'แพนด้า — พื้นหลังป่าไผ่', 'กระดาษสาสีครีม มีเงาลำไผ่ที่ขอบบนและขอบล่าง', 'APP_BACKGROUND', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"background":"#F6F2E9","primary":"#3A4149","glow":"#8FAF9B"},"surface":"FLAT","texture":"FINE_NOISE","motion":"NONE","intensity":"LOW","mediaUrl":"https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/01-background.png"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-app-background.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_app_background', c."id", a."id", 'APP_BACKGROUND', 0, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-app-background'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_profile_frame', 'panda-profile-frame', 'แพนด้า — กรอบไผ่', 'กรอบไผ่พร้อมหูแพนด้า เป็นภาพจริงที่วาดล้อมรูปโปรไฟล์', 'PROFILE_FRAME', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#3A4149","border":"#E2DCCF","glow":"#8FAF9B"},"motion":"NONE","intensity":"LOW","mediaUrl":"https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/02-profile-frame.png"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-profile-frame.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_profile_frame', c."id", a."id", 'PROFILE_FRAME', 1, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-profile-frame'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_profile_badge', 'panda-profile-badge', 'แพนด้า — ป้ายหน้าแพนด้า', 'ป้ายรูปหน้าแพนด้า เป็นภาพจริงที่ติดมุมรูปโปรไฟล์', 'PROFILE_BADGE', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#3A4149","text":"#1E2328","border":"#E2DCCF"},"mediaUrl":"https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/04-profile-badge.png"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-profile-badge.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_profile_badge', c."id", a."id", 'PROFILE_BADGE', 2, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-profile-badge'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_ambient_effect', 'panda-ambient-effect', 'แพนด้า — ใบไผ่ปลิว', 'ผงกระดาษสาบาง ๆ ลอยทับพื้นหลัง', 'AMBIENT_EFFECT', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"background":"#F6F2E9","primary":"#3A4149","glow":"#8FAF9B"},"ambientEffect":"SOFT_GRAIN","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-ambient-effect.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_ambient_effect', c."id", a."id", 'AMBIENT_EFFECT', 3, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-ambient-effect'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_navigation', 'panda-navigation', 'แพนด้า — แถบเมนูกระดาษสา', 'แถบเมนูทรงแคปซูลพื้นขาวนวล', 'NAVIGATION', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#3A4149","text":"#1E2328","muted":"#6B7280","border":"#E2DCCF","glow":"#8FAF9B"},"shape":"PILL","surface":"FLAT","borderEffect":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-navigation.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_navigation', c."id", a."id", 'NAVIGATION', 4, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-navigation'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_header', 'panda-header', 'แพนด้า — แถบด้านบนไผ่', 'แถบด้านบนเรียบ มีเส้นไผ่บาง ๆ ใต้ขอบ', 'HEADER', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#3A4149","text":"#1E2328","muted":"#6B7280","border":"#E2DCCF","glow":"#8FAF9B"},"surface":"FLAT","borderEffect":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-header.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_header', c."id", a."id", 'HEADER', 5, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-header'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_overview_card', 'panda-overview-card', 'แพนด้า — การ์ดภาพรวมกระดาษสา', 'การ์ดใบเด่น ขอบนุ่ม ยกตัวเล็กน้อย', 'OVERVIEW_CARD', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#3A4149","text":"#1E2328","muted":"#6B7280","border":"#E2DCCF","glow":"#8FAF9B","cash":"#5B8DBE","investment":"#A98BC9"},"shape":"SOFT","surface":"ELEVATED","borderEffect":"NONE","texture":"FINE_NOISE","motion":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-overview-card.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_overview_card', c."id", a."id", 'OVERVIEW_CARD', 6, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-overview-card'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_account_card', 'panda-account-card', 'แพนด้า — การ์ดบัญชีกระดาษ', 'การ์ดบัญชีเรียบ อ่านง่าย', 'ACCOUNT_CARD', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#3A4149","text":"#1E2328","muted":"#6B7280","border":"#E2DCCF","glow":"#8FAF9B"},"shape":"SOFT","surface":"FLAT","borderEffect":"NONE","motion":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-account-card.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_account_card', c."id", a."id", 'ACCOUNT_CARD', 7, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-account-card'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_investment_card', 'panda-investment-card', 'แพนด้า — การ์ดลงทุนหน่อไผ่', 'การ์ดพอร์ตลงทุนโทนครีม', 'INVESTMENT_CARD', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#3A4149","text":"#1E2328","muted":"#6B7280","border":"#E2DCCF","glow":"#8FAF9B"},"shape":"SOFT","surface":"FLAT","borderEffect":"NONE","motion":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-investment-card.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_investment_card', c."id", a."id", 'INVESTMENT_CARD', 8, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-investment-card'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_transaction_card', 'panda-transaction-card', 'แพนด้า — รายการรับจ่ายเรียบ', 'แถวรายการเรียงเป็นระเบียบบนพื้นครีม', 'TRANSACTION_CARD', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#3A4149","text":"#1E2328","muted":"#6B7280","border":"#E2DCCF","glow":"#8FAF9B"},"shape":"ROUNDED","surface":"FLAT","borderEffect":"NONE","motion":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-transaction-card.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_transaction_card', c."id", a."id", 'TRANSACTION_CARD', 9, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-transaction-card'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_profile_aura', 'panda-profile-aura', 'แพนด้า — แสงรอบโปรไฟล์ไผ่', 'ออร่าสีไผ่นวล ๆ รอบรูปโปรไฟล์', 'PROFILE_AURA', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#3A4149","glow":"#8FAF9B"},"motion":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-profile-aura.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_profile_aura', c."id", a."id", 'PROFILE_AURA', 10, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-profile-aura'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_chart_style', 'panda-chart-style', 'แพนด้า — กราฟหน่อไผ่', 'เส้นกราฟโค้งนุ่มโทนไผ่', 'CHART_STYLE', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#3A4149","muted":"#6B7280","glow":"#8FAF9B"},"chartStyle":"SMOOTH","intensity":"MEDIUM"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-chart-style.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_chart_style', c."id", a."id", 'CHART_STYLE', 11, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-chart-style'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_icon_set', 'panda-icon-set', 'แพนด้า — ชุดไอคอนมน', 'ไอคอนเส้นมนโทนถ่านกับไผ่', 'ICON_SET', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#3A4149"},"iconStyle":"ROUNDED"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-icon-set.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_icon_set', c."id", a."id", 'ICON_SET', 12, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-icon-set'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_interaction_effect', 'panda-interaction-effect', 'แพนด้า — สัมผัสนุ่ม', 'กดแล้วปุ่มยกตัวขึ้นเบา ๆ', 'INTERACTION_EFFECT', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#3A4149","glow":"#8FAF9B"},"interactionEffect":"SOFT_LIFT","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-interaction-effect.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_interaction_effect', c."id", a."id", 'INTERACTION_EFFECT', 13, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-interaction-effect'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('pd_asset_panda_celebration_effect', 'panda-celebration-effect', 'แพนด้า — ฉลองใบไผ่', 'ใบไผ่ปลิวกระจายตอนฉลอง', 'CELEBRATION_EFFECT', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#3A4149","glow":"#8FAF9B"},"celebrationEffect":"SPARKLE","intensity":"MEDIUM"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda/p-celebration-effect.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'pd_link_panda_celebration_effect', c."id", a."id", 'CELEBRATION_EFFECT', 14, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'panda' AND a."slug" = 'panda-celebration-effect'
ON CONFLICT DO NOTHING;
