import sqlite3 from "sqlite3";
import dotenv from "dotenv";

dotenv.config();

const dbPath = process.env.DB_PATH || "jobs.sqlite";
const db = new sqlite3.Database(dbPath);

db.get(
  "SELECT COUNT(*) as count FROM jobs WHERE status = 'SENT' AND updatedAt >= datetime('now', '-24 hours')",
  (err, row) => {
    if (err) {
      process.exit(1);
    }

    const typedRow = row as { count: number } | undefined;
    if (typedRow && typedRow.count >= 50) {
      process.exit(2);
    }

    process.exit(0);
  },
);
