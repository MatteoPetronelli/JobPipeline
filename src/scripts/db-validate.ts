import sqlite3 from "sqlite3";
import dotenv from "dotenv";

dotenv.config();

const dbPath = process.env.DB_PATH || "jobs.sqlite";
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='jobs'",
    (err, row) => {
      if (err || !row) {
        process.exit(1);
      }

      db.all("PRAGMA table_info(jobs)", (err, rows) => {
        if (err || !rows) {
          process.exit(1);
        }

        const requiredColumns = [
          "hashId",
          "jobTitle",
          "companyName",
          "url",
          "status",
          "rejectionReason",
          "generatedPrompt",
          "createdAt",
          "updatedAt",
        ];

        const typedRows = rows as { name: string }[];
        const columns = typedRows.map((r) => r.name);
        const hasAllColumns = requiredColumns.every((col) =>
          columns.includes(col),
        );

        if (!hasAllColumns) {
          process.exit(1);
        }

        process.exit(0);
      });
    },
  );
});
