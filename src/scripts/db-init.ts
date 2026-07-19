import sqlite3 from "sqlite3";
import dotenv from "dotenv";

dotenv.config();

const dbPath = process.env.DB_PATH || "jobs.sqlite";
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS jobs (
      hashId TEXT PRIMARY KEY,
      jobTitle TEXT NOT NULL,
      companyName TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'NEW',
      rejectionReason TEXT,
      generatedPrompt TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        process.exit(1);
      }
      process.exit(0);
    },
  );
});
