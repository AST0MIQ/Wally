-- The "สงกรานต์" (Songkran) collection, as data rather than schema.
--
-- Shipped as a migration so it reaches every environment through the same
-- `prisma migrate deploy` the build already runs, with no connection string
-- handled by a person. Generated from prisma/data/cosmetics-songkran.ts.
--
-- Every statement is ON CONFLICT DO NOTHING and the join rows resolve their
-- ids by slug, so this is safe on a database where the collection was already
-- seeded by scripts/seed-songkran-theme.ts — those rows win and nothing here
-- overwrites an operator's later edits.
--
-- Artwork already lives in Wally's public Blob store; only rows are written.

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_01_background_png', 'สงกรานต์ — พื้นหลังแอป', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/01-background.png', 'cosmetics/songkran/01-background.png', 'image/png', 0, 752, 1344, 'ACTIVE', 'APP_BACKGROUND', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_02_ambient_png', 'สงกรานต์ — ละอองน้ำ', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/02-ambient.png', 'cosmetics/songkran/02-ambient.png', 'image/png', 0, 752, 1344, 'ACTIVE', 'AMBIENT_EFFECT', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_03_cover_png', 'สงกรานต์ — ปกชุดธีม', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/03-cover.png', 'cosmetics/songkran/03-cover.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'COLLECTION_COVER', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_04_app_background_png', 'สงกรานต์ — ตัวอย่างพื้นหลังแอป', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/04-app-background.png', 'cosmetics/songkran/04-app-background.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_05_ambient_effect_png', 'สงกรานต์ — ตัวอย่างเอฟเฟกต์พื้นหลัง', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/05-ambient-effect.png', 'cosmetics/songkran/05-ambient-effect.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_06_navigation_png', 'สงกรานต์ — ตัวอย่างแถบเมนู', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/06-navigation.png', 'cosmetics/songkran/06-navigation.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_07_header_png', 'สงกรานต์ — ตัวอย่างแถบด้านบน', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/07-header.png', 'cosmetics/songkran/07-header.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_08_overview_card_png', 'สงกรานต์ — ตัวอย่างการ์ดภาพรวม', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/08-overview-card.png', 'cosmetics/songkran/08-overview-card.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_09_account_card_png', 'สงกรานต์ — ตัวอย่างการ์ดบัญชี', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/09-account-card.png', 'cosmetics/songkran/09-account-card.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_10_investment_card_png', 'สงกรานต์ — ตัวอย่างการ์ดการลงทุน', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/10-investment-card.png', 'cosmetics/songkran/10-investment-card.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_11_transaction_card_png', 'สงกรานต์ — ตัวอย่างรายการรับจ่าย', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/11-transaction-card.png', 'cosmetics/songkran/11-transaction-card.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_12_profile_frame_png', 'สงกรานต์ — ตัวอย่างกรอบโปรไฟล์', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/12-profile-frame.png', 'cosmetics/songkran/12-profile-frame.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_13_profile_badge_png', 'สงกรานต์ — ตัวอย่างป้ายโปรไฟล์', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/13-profile-badge.png', 'cosmetics/songkran/13-profile-badge.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_14_profile_aura_png', 'สงกรานต์ — ตัวอย่างแสงรอบโปรไฟล์', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/14-profile-aura.png', 'cosmetics/songkran/14-profile-aura.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_15_chart_style_png', 'สงกรานต์ — ตัวอย่างรูปแบบกราฟ', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/15-chart-style.png', 'cosmetics/songkran/15-chart-style.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_16_icon_set_png', 'สงกรานต์ — ตัวอย่างชุดไอคอน', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/16-icon-set.png', 'cosmetics/songkran/16-icon-set.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_17_interaction_effect_png', 'สงกรานต์ — ตัวอย่างเอฟเฟกต์ตอนกด', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/17-interaction-effect.png', 'cosmetics/songkran/17-interaction-effect.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticMedia" ("id", "name", "url", "pathname", "mimeType", "sizeBytes", "width", "height", "status", "usage", "createdAt", "updatedAt")
VALUES ('sk_media_18_celebration_effect_png', 'สงกรานต์ — ตัวอย่างเอฟเฟกต์ฉลอง', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/18-celebration-effect.png', 'cosmetics/songkran/18-celebration-effect.png', 'image/png', 0, 1344, 752, 'ACTIVE', 'ASSET_PREVIEW', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticCollection" ("id", "slug", "name", "description", "coverUrl", "rarity", "status", "isApplicableAsSet", "sortOrder", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_collection', 'songkran', 'สงกรานต์', 'ธีมสว่างรับเทศกาลสงกรานต์ — น้ำใส แดดเมษา และดอกมะลิ', 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/03-cover.png', 'SPECIAL', 'PUBLISHED', true, 0, now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_app_background', 'songkran-app-background', 'สงกรานต์ — พื้นหลังสายน้ำ', 'ท้องฟ้าเมษายนสีฟ้าจาง กลีบมะลิลอยที่ขอบบนและขอบล่าง', 'APP_BACKGROUND', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"background":"#F2FAFD","primary":"#1CA5C9","glow":"#F2B23E"},"surface":"GRADIENT","texture":"NONE","motion":"NONE","intensity":"LOW","mediaUrl":"https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/01-background.png"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/04-app-background.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_app_background', c."id", a."id", 'APP_BACKGROUND', 0, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-app-background'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_ambient_effect', 'songkran-ambient-effect', 'สงกรานต์ — ละอองน้ำ', 'ละอองน้ำและกลีบมะลิลอยบาง ๆ ทับพื้นหลัง', 'AMBIENT_EFFECT', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"background":"#F2FAFD","primary":"#1CA5C9","glow":"#F2B23E"},"ambientEffect":"SOFT_GRAIN","intensity":"LOW","mediaUrl":"https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/02-ambient.png"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/05-ambient-effect.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_ambient_effect', c."id", a."id", 'AMBIENT_EFFECT', 1, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-ambient-effect'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_navigation', 'songkran-navigation', 'สงกรานต์ — แถบเมนูน้ำใส', 'แถบเมนูทรงแคปซูลกระจกฝ้า ขอบเรืองสีเทอร์คอยซ์', 'NAVIGATION', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#1CA5C9","text":"#10323D","muted":"#55707A","border":"#CDE7F0","glow":"#F2B23E"},"shape":"PILL","surface":"GLASS","borderEffect":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/06-navigation.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_navigation', c."id", a."id", 'NAVIGATION', 2, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-navigation'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_header', 'songkran-header', 'สงกรานต์ — แถบด้านบนใส', 'แถบด้านบนโปร่งแสง มีเส้นน้ำบาง ๆ ใต้ขอบ', 'HEADER', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#1CA5C9","text":"#10323D","muted":"#55707A","border":"#CDE7F0","glow":"#F2B23E"},"surface":"GLASS","borderEffect":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/07-header.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_header', c."id", a."id", 'HEADER', 3, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-header'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_overview_card', 'songkran-overview-card', 'สงกรานต์ — การ์ดภาพรวมแสงแดด', 'การ์ดใบเด่น ขอบไล่เฉดฟ้า-ทอง มีประกายน้ำวิ่งผ่าน', 'OVERVIEW_CARD', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#1CA5C9","text":"#10323D","muted":"#55707A","border":"#CDE7F0","glow":"#F2B23E","cash":"#2E9BD6","investment":"#8A6BE8"},"shape":"SOFT","surface":"ELEVATED","borderEffect":"GRADIENT_BORDER","motion":"SHIMMER","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/08-overview-card.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_overview_card', c."id", a."id", 'OVERVIEW_CARD', 4, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-overview-card'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_account_card', 'songkran-account-card', 'สงกรานต์ — การ์ดบัญชีมะลิ', 'การ์ดบัญชีขาวสะอาด ขอบฟ้าอ่อน', 'ACCOUNT_CARD', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#1CA5C9","text":"#10323D","muted":"#55707A","border":"#CDE7F0","glow":"#F2B23E"},"shape":"SOFT","surface":"FLAT","borderEffect":"NONE","motion":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/09-account-card.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_account_card', c."id", a."id", 'ACCOUNT_CARD', 5, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-account-card'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_investment_card', 'songkran-investment-card', 'สงกรานต์ — การ์ดลงทุนสายน้ำ', 'การ์ดพอร์ตลงทุน พื้นไล่เฉดน้ำใส', 'INVESTMENT_CARD', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#1CA5C9","text":"#10323D","muted":"#55707A","border":"#CDE7F0","glow":"#F2B23E"},"shape":"SOFT","surface":"GRADIENT","borderEffect":"NONE","motion":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/10-investment-card.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_investment_card', c."id", a."id", 'INVESTMENT_CARD', 6, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-investment-card'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_transaction_card', 'songkran-transaction-card', 'สงกรานต์ — รายการรับจ่ายใส', 'แถวรายการเรียบ อ่านง่ายบนพื้นสว่าง', 'TRANSACTION_CARD', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"surface":"#FFFFFF","primary":"#1CA5C9","text":"#10323D","muted":"#55707A","border":"#CDE7F0","glow":"#F2B23E"},"shape":"ROUNDED","surface":"FLAT","borderEffect":"NONE","motion":"NONE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/11-transaction-card.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_transaction_card', c."id", a."id", 'TRANSACTION_CARD', 7, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-transaction-card'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_profile_frame', 'songkran-profile-frame', 'สงกรานต์ — กรอบโปรไฟล์หยดน้ำ', 'กรอบวงกลมไล่เฉดฟ้า-ทอง ประดับหยดน้ำ', 'PROFILE_FRAME', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#1CA5C9","border":"#CDE7F0","glow":"#F2B23E"},"borderEffect":"SHINE","motion":"NONE","intensity":"MEDIUM"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/12-profile-frame.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_profile_frame', c."id", a."id", 'PROFILE_FRAME', 8, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-profile-frame'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_profile_badge', 'songkran-profile-badge', 'สงกรานต์ — ป้ายโปรไฟล์ทอง', 'ป้ายทรงแคปซูลสีทองแดดเมษา', 'PROFILE_BADGE', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#1CA5C9","text":"#10323D","border":"#CDE7F0"},"shape":"PILL"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/13-profile-badge.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_profile_badge', c."id", a."id", 'PROFILE_BADGE', 9, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-profile-badge'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_profile_aura', 'songkran-profile-aura', 'สงกรานต์ — แสงรอบโปรไฟล์แดดอ่อน', 'ออร่าฟ้า-ทองฟุ้งรอบรูปโปรไฟล์', 'PROFILE_AURA', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#1CA5C9","glow":"#F2B23E"},"motion":"PULSE","intensity":"LOW"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/14-profile-aura.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_profile_aura', c."id", a."id", 'PROFILE_AURA', 10, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-profile-aura'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_chart_style', 'songkran-chart-style', 'สงกรานต์ — กราฟสายน้ำ', 'เส้นกราฟโค้งนุ่มเหมือนสายน้ำ', 'CHART_STYLE', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#1CA5C9","muted":"#55707A","glow":"#F2B23E"},"chartStyle":"SMOOTH","intensity":"MEDIUM"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/15-chart-style.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_chart_style', c."id", a."id", 'CHART_STYLE', 11, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-chart-style'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_icon_set', 'songkran-icon-set', 'สงกรานต์ — ชุดไอคอนมนน้ำ', 'ไอคอนเส้นมนโทนฟ้าเทอร์คอยซ์', 'ICON_SET', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#1CA5C9"},"iconStyle":"ROUNDED"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/16-icon-set.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_icon_set', c."id", a."id", 'ICON_SET', 12, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-icon-set'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_interaction_effect', 'songkran-interaction-effect', 'สงกรานต์ — ระลอกน้ำตอนกด', 'กดแล้วมีระลอกน้ำแผ่ออกจากจุดที่แตะ', 'INTERACTION_EFFECT', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#1CA5C9","glow":"#F2B23E"},"interactionEffect":"RIPPLE","intensity":"MEDIUM"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/17-interaction-effect.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_interaction_effect', c."id", a."id", 'INTERACTION_EFFECT', 13, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-interaction-effect'
ON CONFLICT DO NOTHING;

INSERT INTO "CosmeticAsset" ("id", "slug", "name", "description", "slot", "rarity", "status", "acquisitionType", "isCanonicalDefault", "configVersion", "config", "previewUrl", "publishedAt", "createdAt", "updatedAt")
VALUES ('sk_asset_songkran_celebration_effect', 'songkran-celebration-effect', 'สงกรานต์ — ฉลองสาดน้ำ', 'หยดน้ำและกลีบมะลิพุ่งกระจายตอนฉลอง', 'CELEBRATION_EFFECT', 'SPECIAL', 'PUBLISHED', 'LIMITED_EVENT', false, 2, '{"colors":{"primary":"#1CA5C9","glow":"#F2B23E"},"celebrationEffect":"CONFETTI","intensity":"MEDIUM"}'::jsonb, 'https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran/18-celebration-effect.png', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO "CollectionAsset" ("id", "collectionId", "assetId", "slot", "sortOrder", "createdAt")
SELECT 'sk_link_songkran_celebration_effect', c."id", a."id", 'CELEBRATION_EFFECT', 14, now()
FROM "CosmeticCollection" c, "CosmeticAsset" a
WHERE c."slug" = 'songkran' AND a."slug" = 'songkran-celebration-effect'
ON CONFLICT DO NOTHING;
