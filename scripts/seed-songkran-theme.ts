/**
 * Seeds the "สงกรานต์" (Songkran) cosmetic collection: 18 library images, 15
 * assets — one per rendered slot — and the collection that bundles them.
 *
 * The artwork already lives in Wally's public Blob store, so this script only
 * writes rows and is safe to run against any environment:
 *
 *   npx tsx --tsconfig tsconfig.json scripts/seed-songkran-theme.ts
 *   DATABASE_URL=... DIRECT_URL=... npx tsx --tsconfig tsconfig.json scripts/seed-songkran-theme.ts
 *
 * Idempotent: media is keyed by URL and assets by slug, so re-running updates
 * in place rather than duplicating.
 *
 * Flags:
 *   --publish        also publish the 15 assets and then the collection.
 *                    PUBLISHING FREEZES EACH ASSET'S CONFIG PERMANENTLY, which
 *                    is why it is opt-in. Assets go first: the collection
 *                    service refuses to publish a set holding an unpublished
 *                    asset, and this script keeps that invariant.
 *   --grant <email>  give that user an entitlement for all 15 assets, so the
 *                    theme can actually be equipped. Published only means the
 *                    item exists; ownership is separate.
 */
process.loadEnvFile(".env");
try {
  process.loadEnvFile(".env.local");
} catch {
  /* optional */
}

import { PrismaClient } from "@prisma/client";
import { parseAssetConfig } from "../src/lib/cosmetics/config";
import { ASSETS, BLOB, COLLECTION, MEDIA } from "../prisma/data/cosmetics-songkran";

const prisma = new PrismaClient();

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function flagValue(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  // Say which database is about to be written to. `process.loadEnvFile` never
  // overrides a variable already in the environment, so a DATABASE_URL passed
  // on the command line wins over .env — but seeding the wrong environment is
  // worth one line of confirmation.
  const target = process.env.DATABASE_URL ?? "";
  console.log(`target: ${target.replace(/\/\/[^@]*@/, "//***@").split("?")[0] || "(no DATABASE_URL)"}`);

  // Fail loudly before writing anything if a config would not survive the
  // validator the admin form and the renderer both run.
  for (const a of ASSETS) parseAssetConfig(2, a.config);

  for (const m of MEDIA) {
    const url = `${BLOB}/${m.file}`;
    const data = {
      name: m.name,
      url,
      pathname: `cosmetics/songkran/${m.file}`,
      mimeType: "image/png",
      sizeBytes: 0,
      width: m.width,
      height: m.height,
      usage: m.usage,
      status: "ACTIVE" as const,
    };
    await prisma.cosmeticMedia.upsert({ where: { url }, update: data, create: data });
  }
  console.log(`media: ${MEDIA.length} rows`);

  const collection = await prisma.cosmeticCollection.upsert({
    where: { slug: COLLECTION.slug },
    update: {},
    create: {
      slug: COLLECTION.slug,
      name: COLLECTION.name,
      description: COLLECTION.description,
      coverUrl: COLLECTION.coverUrl,
      rarity: COLLECTION.rarity,
      status: "DRAFT",
      isApplicableAsSet: true,
    },
  });
  console.log(`collection: ${collection.slug} (${collection.status})`);

  for (const [i, a] of ASSETS.entries()) {
    const existing = await prisma.cosmeticAsset.findUnique({ where: { slug: a.slug } });
    if (existing?.publishedAt) {
      console.log(`  skip ${a.slug} — published, config is frozen`);
      continue;
    }
    const asset = await prisma.cosmeticAsset.upsert({
      where: { slug: a.slug },
      update: {
        name: a.name,
        description: a.description,
        previewUrl: a.preview,
        configVersion: 2,
        config: a.config,
      },
      create: {
        slug: a.slug,
        name: a.name,
        description: a.description,
        slot: a.slot,
        rarity: "SPECIAL",
        status: "DRAFT",
        acquisitionType: "LIMITED_EVENT",
        previewUrl: a.preview,
        configVersion: 2,
        config: a.config,
      },
    });
    await prisma.collectionAsset.upsert({
      where: { collectionId_assetId: { collectionId: collection.id, assetId: asset.id } },
      update: { sortOrder: i },
      create: { collectionId: collection.id, assetId: asset.id, slot: a.slot, sortOrder: i },
    });
  }
  console.log(`assets: ${ASSETS.length} linked to ${collection.slug}`);

  if (flag("publish")) {
    const slugs = ASSETS.map((a) => a.slug);
    const now = new Date();
    await prisma.cosmeticAsset.updateMany({
      where: { slug: { in: slugs }, publishedAt: null },
      data: { status: "PUBLISHED", publishedAt: now },
    });
    await prisma.cosmeticAsset.updateMany({
      where: { slug: { in: slugs }, status: { not: "PUBLISHED" } },
      data: { status: "PUBLISHED" },
    });
    // Mirrors setCollectionStatus: a set may not be published while it holds
    // an unpublished asset.
    const unpublished = await prisma.cosmeticAsset.count({
      where: { slug: { in: slugs }, status: { not: "PUBLISHED" } },
    });
    if (unpublished > 0) throw new Error(`${unpublished} asset(s) still unpublished`);
    await prisma.cosmeticCollection.update({
      where: { id: collection.id },
      data: { status: "PUBLISHED", publishedAt: collection.publishedAt ?? now },
    });
    console.log(`published: ${slugs.length} assets + the collection`);
  } else {
    console.log("left in DRAFT — pass --publish to publish (freezes configs)");
  }

  const email = flagValue("grant");
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`no user with email ${email}`);
    const assets = await prisma.cosmeticAsset.findMany({
      where: { slug: { in: ASSETS.map((a) => a.slug) } },
      select: { id: true },
    });
    for (const a of assets) {
      await prisma.userEntitlement.upsert({
        where: { userId_assetId: { userId: user.id, assetId: a.id } },
        update: { status: "ACTIVE", revokedAt: null },
        create: {
          userId: user.id,
          assetId: a.id,
          acquisitionType: "LIMITED_EVENT",
          sourceCollectionId: collection.id,
        },
      });
    }
    console.log(`granted: ${assets.length} assets to ${email}`);
  }
}

void main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
