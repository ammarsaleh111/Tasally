import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Please configure your environment.");
}

declare global {
  // eslint-disable-next-line no-var
  var __drizzleClient: ReturnType<typeof postgres> | undefined;
}

const client = global.__drizzleClient ??
  postgres(connectionString, {
    max: 1,
    prepare: true,
    ssl: "prefer",
  });

if (process.env.NODE_ENV !== "production") {
  global.__drizzleClient = client;
}

export const db = drizzle(client, { schema });
export * from "./schema";
