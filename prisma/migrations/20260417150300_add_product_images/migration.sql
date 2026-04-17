-- Add missing Product.images column (text array)
-- This fixes runtime errors when Prisma writes Product rows on DBs created
-- before the `images` field existed in the schema.

ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

