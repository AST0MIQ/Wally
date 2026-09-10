-- Card slots can now carry their own surface artwork, so the library needs a
-- usage to file it under.
ALTER TYPE "MediaUsage" ADD VALUE IF NOT EXISTS 'CARD_SURFACE';
