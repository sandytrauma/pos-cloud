import * as dotenv from "dotenv";
import path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
// Use RELATIVE paths to avoid @/ alias errors in the terminal
import { users } from "./schema"; 

// 1. Manually load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing in .env.local");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function seed() {
  console.log("🌱 Starting seed...");
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await db.insert(users).values({
      name: "Admin",
      email: "admin@kitchen.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Seed successful! User: admin@kitchen.com / admin123");
  } catch (error) {
    console.error("❌ Seed error:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

seed();