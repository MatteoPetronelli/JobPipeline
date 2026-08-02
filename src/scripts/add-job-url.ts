import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import { FilterEngine } from "../services/filter-engine.js";
import { closeDb } from "../db/database.js";
import { calculateMatchScore } from "../services/matcher.service.js";

chromium.use(stealth());

const engine = new FilterEngine();

const run = async () => {
  const url = process.argv[2];
  if (!url) {
    console.error("Please provide a job URL.");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "fr-FR",
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    let rawDescription = "";
    const ldJsonScripts = await page.$$eval(
      'script[type="application/ld+json"]',
      (scripts) => scripts.map((s) => s.textContent),
    );

    for (const scriptContent of ldJsonScripts) {
      if (!scriptContent) continue;
      try {
        const data = JSON.parse(scriptContent) as unknown;
        if (typeof data === "object" && data !== null) {
          const record = data as Record<string, unknown>;
          if (
            record["@type"] === "JobPosting" &&
            typeof record.description === "string"
          ) {
            rawDescription = record.description;
          }
        }
      } catch {
        // ignore
      }
    }

    if (!rawDescription) {
      const descriptionElement = await page.$(
        '#jobDescriptionText, [class*="job-description"], div[data-testid="jobDescriptionText"]',
      );
      rawDescription = (await descriptionElement?.textContent()) || "";
    }

    const titleElement = await page.$(
      'h1.jobsearch-JobInfoHeader-title span, h1, [data-testid="jobsearch-JobInfoHeader-title"]',
    );
    const title = (await titleElement?.textContent()) || "Titre inconnu";

    const companyElement = await page.$(
      '[data-company-name="true"], [data-testid="inlineHeader-companyName"]',
    );
    const company =
      (await companyElement?.textContent()) || "Entreprise inconnue";

    const locationElement = await page.$(
      'div[data-testid="job-location"], div#jobLocationText',
    );
    const location = (await locationElement?.textContent()) || "Lieu inconnu";

    const offer = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      url,
      description: rawDescription.trim().substring(0, 4000),
    };

    console.log(`Scraped: ${offer.title} at ${offer.company}`);

    const hashId = engine.generateHashId(offer.url, offer.company);

    const isProcessed = await engine.isJobProcessed(hashId);
    if (isProcessed) {
      console.log("Job already processed in DB.");
      return;
    }

    const zaiResponse = await engine.evaluateJobBatch([
      {
        hashId,
        title: offer.title,
        company: offer.company,
        location: offer.location,
        description: offer.description,
      },
    ]);

    const result = zaiResponse.results[0];
    if (!result) {
      console.error("No result from Z.ai");
      return;
    }

    const status = result.approved ? "APPROVED" : "REJECTED";
    const reason = result.approved ? null : result.reason;
    const generatedPrompt = result.approved
      ? result.pitch || result.reason
      : null;

    await engine.persistJobStatus(
      hashId,
      offer,
      status,
      reason,
      generatedPrompt,
    );

    if (result.approved) {
      const jobRecord = {
        url: offer.url,
        jobTitle: offer.title,
        companyName: offer.company,
        rawDescription: offer.description,
        status: "APPROVED",
        hashId: hashId,
      };

      const { score, matchedKeywords } = calculateMatchScore(jobRecord);
      console.log(`Score: ${score}, Matched: ${matchedKeywords.join(", ")}`);
    } else {
      console.log(`Job rejected by Z.ai: ${result.reason}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
    await closeDb();
  }
};

run();
