import sqlite3 from "sqlite3";

const dbPath = process.env.DB_PATH || "jobs.sqlite";
const db = new sqlite3.Database(dbPath);

export const dbRun = (sql: string, params: unknown[] = []): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const dbAll = <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

export const dbGet = <T>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
};

export const closeDb = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const initAuditTable = async (): Promise<void> => {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      executedAt TEXT,
      scrapedCount INTEGER,
      approvedCount INTEGER,
      status TEXT,
      errorMessage TEXT
    )
  `);

  try {
    await dbRun("ALTER TABLE jobs ADD COLUMN appliedAt TEXT");
  } catch (e) {
    String(e);
  }

  try {
    await dbRun("ALTER TABLE jobs ADD COLUMN lastFollowupNotifiedAt TEXT");
  } catch (e) {
    String(e);
  }
};

export const createPipelineRun = async (
  executedAt: string,
  status: string,
): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO pipeline_runs (executedAt, scrapedCount, approvedCount, status, errorMessage) VALUES (?, 0, 0, ?, NULL)",
      [executedAt, status],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      },
    );
  });
};

export const updatePipelineRun = async (
  id: number,
  scrapedCount: number,
  approvedCount: number,
  status: string,
  errorMessage?: string,
): Promise<void> => {
  await dbRun(
    "UPDATE pipeline_runs SET scrapedCount = ?, approvedCount = ?, status = ?, errorMessage = ? WHERE id = ?",
    [scrapedCount, approvedCount, status, errorMessage || null, id],
  );
};
