import pg from "pg";
import { runMigrations } from "../storage/postgres/migrations";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run migrations");
}

const pool = new Pool({ connectionString });

await runMigrations(pool);
await pool.end();

console.log("Database migrations completed");
