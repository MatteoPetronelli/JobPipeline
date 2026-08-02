import { execSync } from "child_process";
import {
  initAuditTable,
  createPipelineRun,
  updatePipelineRun,
} from "../db/database.js";
import { getFilteredOffers, updateJobStatus } from "../db/queries.js";
import { calculateMatchScore } from "../services/matcher.service.js";
import { sendJobNotification } from "../services/notifier.service.js";
import { checkAndFlagFollowups } from "../services/followup.service.js";
import type { JobOffer } from "../models/types.js";

export async function runPipeline(): Promise<void> {
  let runId = 0;
  try {
    await initAuditTable();
    runId = await createPipelineRun(new Date().toISOString(), "RUNNING");

    execSync("npx tsx src/scripts/scrape-jobs.ts", { stdio: "inherit" });

    execSync("npx tsx src/scripts/filter-jobs.ts", { stdio: "inherit" });

    const rawOffers = await getFilteredOffers({});
    const approvedOffers = rawOffers.filter(
      (o) => o.status === "APPROVED",
    );

    let matchedCount = 0;
    const offersToNotify: JobOffer[] = [];

    for (const offer of approvedOffers) {
      if (!offer.hashId) continue;

      const jobOffer: JobOffer = {
        url: offer.url,
        jobTitle: offer.jobTitle,
        companyName: offer.companyName,
        rawDescription: "",
        status: offer.status,
        hashId: offer.hashId,
      };

      const { score, matchedKeywords } = calculateMatchScore(jobOffer);
      jobOffer.score = score;

      if (score > 75) {
        await updateJobStatus(
          offer.hashId,
          "HIGH_MATCH",
          `Matched: ${matchedKeywords.join(", ")}`,
        );
        jobOffer.status = "HIGH_MATCH";
        matchedCount++;
      }

      offersToNotify.push(jobOffer);
    }

    const previousHighMatches = rawOffers.filter(
      (o) => o.status === "HIGH_MATCH",
    );
    for (const pm of previousHighMatches) {
      offersToNotify.push({
        url: pm.url,
        jobTitle: pm.jobTitle,
        companyName: pm.companyName,
        rawDescription: "",
        status: pm.status,
        hashId: pm.hashId,
      });
    }

    const followups = await checkAndFlagFollowups();
    offersToNotify.push(...followups);

    await sendJobNotification(offersToNotify);

    await updatePipelineRun(runId, rawOffers.length, matchedCount, "SUCCESS");
  } catch (error) {
    console.error(error);
    if (runId > 0) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      await updatePipelineRun(runId, 0, 0, "FAILED", msg);
    }
    process.exit(1);
  }
}

runPipeline();
