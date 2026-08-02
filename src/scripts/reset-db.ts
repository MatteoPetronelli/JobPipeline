import { dbRun, closeDb } from "../db/database.js";

const run = async () => {
  try {
    await dbRun("DELETE FROM jobs;");
    console.log("[DB RESET] Successfully purged all jobs from data/app.db");
  } finally {
    await closeDb();
  }
};

run();
