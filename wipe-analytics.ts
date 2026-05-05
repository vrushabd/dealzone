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
    
    // Clear PageView table
    await client.query('TRUNCATE TABLE "PageView" CASCADE;');
    
    console.log("Successfully deleted all Page Views (Analytics) data!");
  } catch (error) {
    console.error("Error wiping analytics:", error);
  } finally {
    await client.end();
  }
}

run();
