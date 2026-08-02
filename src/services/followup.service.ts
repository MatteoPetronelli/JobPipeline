import { dbAll, dbRun } from "../db/database.js";
import type { JobOffer } from "../models/types.js";

export async function checkAndFlagFollowups(): Promise<JobOffer[]> {
  const jobs = await dbAll<{
    hashId: string;
    url: string;
    jobTitle: string;
    companyName: string;
    appliedAt: string;
    lastFollowupNotifiedAt: string | null;
  }>(
    "SELECT hashId, url, jobTitle, companyName, appliedAt, lastFollowupNotifiedAt FROM jobs WHERE status = 'APPLIED' AND appliedAt IS NOT NULL",
  );

  const flaggedOffers: JobOffer[] = [];
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  for (const job of jobs) {
    const appliedTime = new Date(job.appliedAt).getTime();
    if (now - appliedTime >= SEVEN_DAYS_MS) {
      if (!job.lastFollowupNotifiedAt) {
        const timestamp = new Date().toISOString();
        await dbRun(
          "UPDATE jobs SET status = 'NEEDS_FOLLOWUP', lastFollowupNotifiedAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE hashId = ?",
          [timestamp, job.hashId],
        );
        flaggedOffers.push({
          url: job.url,
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          rawDescription: "",
          status: "NEEDS_FOLLOWUP",
          hashId: job.hashId,
        });
      }
    }
  }

  return flaggedOffers;
}
