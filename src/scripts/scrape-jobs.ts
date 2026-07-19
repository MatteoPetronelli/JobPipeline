import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { JobScraperService } from "../services/job-scraper.service.js";
import { jobSchema, Job } from "../models/job.model.js";

async function main(): Promise<void> {
  const scraper = new JobScraperService();
  try {
    await scraper.initialize();

    const searchQuery = "Alternance Développeur Fullstack";
    const maxPages = 3;

    let indeedJobs: Job[] = [];
    try {
      indeedJobs = await scraper.scrapeIndeed(searchQuery, maxPages);
    } catch (error) {
      console.error("ERROR_SCRAPING_INDEED", error);
    }

    let wttjJobs: Job[] = [];
    try {
      wttjJobs = await scraper.scrapeWelcomeToTheJungle(searchQuery, maxPages);
    } catch (error) {
      console.error("ERROR_SCRAPING_WTTJ", error);
    }

    const allJobs = [...indeedJobs, ...wttjJobs];

    const uniqueJobs: Job[] = [];
    const seenKeys = new Set<string>();

    for (const job of allJobs) {
      const key = `${job.jobTitle.toLowerCase()}|${job.companyName.toLowerCase()}`;
      if (!seenKeys.has(key) && !seenKeys.has(job.url)) {
        seenKeys.add(key);
        seenKeys.add(job.url);
        uniqueJobs.push(job);
      }
    }

    const jobArraySchema = z.array(jobSchema);
    const parsedData = jobArraySchema.safeParse(uniqueJobs);

    if (!parsedData.success) {
      console.error("ERROR_SCHEMA_VALIDATION", parsedData.error);
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
    console.error("FATAL_ERROR", error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main().catch(() => process.exit(1));
