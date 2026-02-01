import 'dotenv/config'; // Required to read your DATABASE_URL from .env.local
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({
  path: '.env.local',
});

export default defineConfig({
  // Path to your schema file (since we are not using a src folder)
  schema: './db/schema.ts',
  
  // Where Drizzle will store the generated SQL migration files
  out: './drizzle',
  
  // Use the 'postgresql' dialect
  dialect: 'postgresql',
  
  dbCredentials: {
    // Ensure this variable is defined in your .env.local file
    url: process.env.DATABASE_URL!,
  },
  
  // Strict mode helps prevent data loss by asking for confirmation on risky changes
  strict: true,
  verbose: true,
});