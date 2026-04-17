import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

if (typeof window !== "undefined") {
  throw new Error("PrismaClient can only be initialized on the server.");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase connection string."
    );
  }
  
  // Strict connection pooling for Supabase (limit 15)
  // We limit each server instance to 3 connections to allow room for
  // multiple build workers and other concurrent requests.
  const pool = new Pool({ 
    connectionString,
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
