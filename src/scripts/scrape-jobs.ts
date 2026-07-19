import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { JobScraperService } from "../services/job-scraper.service.js";
import { jobSchema } from "../models/job.model.js";

async function main(): Promise<void> {
  const scraper = new JobScraperService();
  try {
    await scraper.initialize();

    const jobs = await scraper.scrapeIndeed(
      "Alternance Développeur Fullstack",
      3,
    );

    const jobArraySchema = z.array(jobSchema);
    const parsedData = jobArraySchema.safeParse(jobs);

    if (!parsedData.success) {
      console.error(parsedData.error);
      process.exit(1);
    }

    const outputDir = path.join(process.cwd(), "data");
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, "raw-offers.json");
    await fs.writeFile(
      outputPath,
      JSON.stringify(parsedData.data, null, 2),
      "utf-8",
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main().catch(() => process.exit(1));
