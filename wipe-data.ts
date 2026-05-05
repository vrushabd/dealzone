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
    
    // Clear Orders, Complaints, Users, and any left over reviews/cart items
    await client.query('TRUNCATE TABLE "Order" CASCADE;');
    await client.query('TRUNCATE TABLE "Complaint" CASCADE;');
    await client.query('TRUNCATE TABLE "User" CASCADE;');
    await client.query('TRUNCATE TABLE "ProductReview" CASCADE;');
    await client.query('TRUNCATE TABLE "CartItem" CASCADE;');
    
    console.log("Successfully deleted all orders, complaints, users, and comments!");
  } catch (error) {
    console.error("Error wiping data:", error);
  } finally {
    await client.end();
  }
}

run();
