import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/pos";

declare global {
  // eslint-disable-next-line no-var
  var _postgresClient: postgres.Sql | undefined;
}

const client = globalThis._postgresClient ?? postgres(connectionString, { 
  prepare: false,
  max: process.env.NODE_ENV === "production" ? 10 : 2,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== "production") {
  globalThis._postgresClient = client;
}

export const db = drizzle(client, { schema });
export { client };