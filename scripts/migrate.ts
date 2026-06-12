import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "greenlight.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

console.log("Running migrations...");
migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations complete.");
sqlite.close();
