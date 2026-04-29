-- Add boughtCount field to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "boughtCount" INTEGER;

-- Create Complaint table
CREATE TABLE IF NOT EXISTS "Complaint" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "subject"   TEXT NOT NULL,
    "message"   TEXT NOT NULL,
    "status"    TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);
