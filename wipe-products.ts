import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database...");
    
    // We must cascade delete because of foreign key constraints
    await client.query('TRUNCATE TABLE "Product" CASCADE;');
    
    console.log("Successfully deleted all products and their related data!");
  } catch (error) {
    console.error("Error wiping products:", error);
  } finally {
    await client.end();
  }
}

run();
