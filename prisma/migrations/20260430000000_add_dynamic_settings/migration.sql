-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "announcementLink" TEXT,
ADD COLUMN "announcementText" TEXT,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "facebookUrl" TEXT,
ADD COLUMN "freeShippingThreshold" DOUBLE PRECISION DEFAULT 500,
ADD COLUMN "instagramUrl" TEXT,
ADD COLUMN "shippingFee" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "twitterUrl" TEXT,
ADD COLUMN "whatsappNumber" TEXT,
ADD COLUMN "youtubeUrl" TEXT;
