import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import { JobScraperService } from "../services/job-scraper.service.js";
import { jobSchema, Job } from "../models/job.model.js";

async function main(): Promise<void> {
  const scraper = new JobScraperService();
  try {
    const headless = process.env.HEADLESS !== "false";
    await scraper.initialize(headless);

    const rawQueries =
      process.env.SCRAPE_QUERIES ||
      process.env.SCRAPE_QUERY ||
      "Alternance Développeur Fullstack";
    const queries = rawQueries
      .split(",")
      .map((q) => q.trim())
      .filter(Boolean);
    const maxPages = Number(process.env.SCRAPE_MAX_PAGES) || 3;

    const uniqueJobs: Job[] = [];
    const seenHashIds = new Set<string>();

    const indeedResults: Job[][] = [];
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      let jobs: Job[] = [];
      try {
        jobs = await scraper.scrapeIndeed(query, maxPages);
      } catch (error) {
        console.error("ERROR_SCRAPING_INDEED", error);
        if (error instanceof Error && error.message === "CloudflareBlocked") break;
        if (error instanceof Error && error.message.includes("browser has been closed")) process.exit(1);
        if (error instanceof Error && error.message.includes("Execution context was destroyed")) process.exit(1);
      }
      indeedResults.push(jobs);
      if (i < queries.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    const wttjResults: Job[][] = [];
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      let jobs: Job[] = [];
      try {
        jobs = await scraper.scrapeWelcomeToTheJungle(query, maxPages);
      } catch (error) {
        console.error("ERROR_SCRAPING_WTTJ", error);
        if (error instanceof Error && error.message.includes("browser has been closed")) process.exit(1);
        if (error instanceof Error && error.message.includes("Execution context was destroyed")) process.exit(1);
      }
      wttjResults.push(jobs);
      if (i < queries.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const allJobs = [...(indeedResults[i] || []), ...(wttjResults[i] || [])];
      let newJobsCount = 0;

      for (const job of allJobs) {
        const hashId = crypto
          .createHash("sha256")
          .update(`${job.url}-${job.companyName}`)
          .digest("hex");

        if (!seenHashIds.has(hashId)) {
          seenHashIds.add(hashId);
          uniqueJobs.push(job);
          newJobsCount++;
        }
      }

      console.log(
        `Query ${i + 1}/${queries.length}: "${query}" -> ${newJobsCount} new jobs`,
      );
    }

    const jobArraySchema = z.array(jobSchema);
    const parsedData = jobArraySchema.safeParse(uniqueJobs);

    if (!parsedData.success) {
      console.error("ERROR_SCHEMA_VALIDATION", parsedData.error);
      process.exit(1);
    }

    const outputData = parsedData.data.map((job) => ({
      url: job.url,
      title: job.jobTitle,
      company: job.companyName,
      description: job.rawDescription,
      location: job.location,
    }));

    const outputDir = path.join(process.cwd(), "data");
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, "raw-offers.json");
    await fs.writeFile(
      outputPath,
      JSON.stringify(outputData, null, 2),
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
