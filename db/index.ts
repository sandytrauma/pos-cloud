import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Ensure the connection string is in your .env.local
const connectionString = process.env.DATABASE_URL!;

// For edge environments/serverless, we use a single connection
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });