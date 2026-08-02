import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { FilterEngine } from "../services/filter-engine.js";
import { dbRun, closeDb } from "../db/database.js";
import { RawJobOffer } from "../models/types.js";

dotenv.config();

const engine = new FilterEngine();

const run = async () => {
  try {
    const rawOffersPath = path.resolve(process.cwd(), "data/raw-offers.json");
    const rawData = await fs.readFile(rawOffersPath, "utf-8");
    const offers = JSON.parse(rawData) as RawJobOffer[];

    const pendingZaiOffers: {
      id: string;
      description: string;
      offer: RawJobOffer;
    }[] = [];

    for (const offer of offers) {
      const hashId = engine.generateHashId(offer.url, offer.company);
      const isProcessed = await engine.isJobProcessed(hashId);
      if (isProcessed) continue;

      const isDuplicate = await engine.isDuplicateJob(
        offer.title,
        offer.company,
      );
      if (isDuplicate) {
        await engine.persistJobStatus(
          hashId,
          offer,
          "REJECTED",
          "Duplicate job title and company",
        );
        continue;
      }

      const codeFilterReason = engine.applyCodeFilter(offer);
      if (codeFilterReason) {
        await engine.persistJobStatus(
          hashId,
          offer,
          "REJECTED",
          codeFilterReason,
        );
        continue;
      }

      pendingZaiOffers.push({
        id: hashId,
        description:
          offer.description ??
          (offer as RawJobOffer & { rawDescription?: string }).rawDescription ??
          "",
        offer,
      });
    }

    for (let i = 0; i < pendingZaiOffers.length; i += 20) {
      const batch = pendingZaiOffers.slice(i, i + 20);
      const batchPayload = batch.map((b) => ({
        hashId: b.id,
        title: b.offer.title,
        company: b.offer.company,
        location: b.offer.location,
        description: b.description,
      }));

      console.log(
        `[Z.ai BATCH] Dispatched batch of ${batch.length} jobs in 1 API call...`,
      );
      const zaiResponse = await engine.evaluateJobBatch(batchPayload);

      await dbRun("BEGIN TRANSACTION");
      try {
        for (const result of zaiResponse.results) {
          const item = batch.find((b) => b.id === result.hashId);
          if (!item) continue;

          const status = result.approved ? "APPROVED" : "REJECTED";
          const reason = result.approved ? null : result.reason;
          const generatedPrompt = result.approved
            ? result.pitch || result.reason
            : null;

          await engine.persistJobStatus(
            result.hashId,
            item.offer,
            status,
            reason,
            generatedPrompt,
          );
        }
        await dbRun("COMMIT");
      } catch (err) {
        await dbRun("ROLLBACK");
        throw err;
      }
    }
  } catch {
    process.exit(1);
  } finally {
    await closeDb();
  }
};

run();
