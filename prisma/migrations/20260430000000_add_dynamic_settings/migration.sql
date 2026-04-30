-- AlterTable: Add new dynamic site settings fields (IF NOT EXISTS for safety)
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "announcementLink" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "announcementText" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "freeShippingThreshold" DOUBLE PRECISION DEFAULT 500;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "shippingFee" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "twitterUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;
