-- The avatar frame and badge can now carry real artwork instead of only CSS,
-- so the library needs somewhere to file those images.
ALTER TYPE "MediaUsage" ADD VALUE IF NOT EXISTS 'PROFILE_FRAME';
ALTER TYPE "MediaUsage" ADD VALUE IF NOT EXISTS 'PROFILE_BADGE';
