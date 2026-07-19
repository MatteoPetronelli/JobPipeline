import { chromium, Browser, BrowserContext, Page } from "playwright";
import { Job } from "../models/job.model.js";

export class JobScraperService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  public async initialize(): Promise<void> {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({ userAgent });
    this.page = await this.context.newPage();
  }

  public async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  public async scrapeIndeed(
    searchQuery: string,
    maxPages: number,
  ): Promise<Job[]> {
    if (!this.page) {
      throw new Error("ScraperNotInitialized");
    }

    const jobs: Job[] = [];
    let currentPage = 0;
    const baseSearchUrl = `https://fr.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}`;

    while (currentPage < maxPages) {
      const url =
        currentPage === 0
          ? baseSearchUrl
          : `${baseSearchUrl}&start=${currentPage * 10}`;

      const response = await this.page.goto(url, {
        waitUntil: "domcontentloaded",
      });
      if (response?.status() === 403) {
        console.warn("FAILED_TEMPORARY");
        break;
      }

      await this.page.waitForTimeout(2000);

      const jobCards = await this.page.$$("div.job_seen_beacon");
      if (jobCards.length === 0) {
        break;
      }

      for (const card of jobCards) {
        try {
          const titleElement = await card.$(
            'h2.jobTitle span, [role="heading"] span',
          );
          const titleText = await titleElement?.textContent();
          if (!titleText) {
            console.warn("[SELECTOR_DEPRECATED]");
            continue;
          }

          const companyElement = await card.$(
            'span[data-testid="company-name"], [data-company-name="true"]',
          );
          const companyText = await companyElement?.textContent();

          const locationElement = await card.$(
            'div[data-testid="text-location"], [data-testid="location"]',
          );
          const locationText = await locationElement?.textContent();

          const linkElement = await card.$("a.jcs-JobTitle, a[data-jk]");
          const href = await linkElement?.getAttribute("href");

          if (!titleText || !companyText || !href) {
            console.warn("[SELECTOR_DEPRECATED]");
            continue;
          }

          const fullUrl = href.startsWith("http")
            ? href
            : `https://fr.indeed.com${href}`;

          jobs.push({
            jobTitle: titleText.trim(),
            companyName: companyText.trim(),
            location: locationText?.trim(),
            contractType: "Inconnu",
            url: fullUrl,
            rawDescription: "",
          });
        } catch (error) {
          console.error("ERROR_SCRAPING", error);
        }
      }

      currentPage++;
    }

    const jobsWithDescriptions: Job[] = [];

    for (const job of jobs) {
      try {
        const response = await this.page.goto(job.url, {
          waitUntil: "domcontentloaded",
        });

        if (response?.status() === 403) {
          console.warn("FAILED_TEMPORARY");
          break;
        }

        await this.page.evaluate(() => {
          const scripts = document.querySelectorAll("script");
          const styles = document.querySelectorAll("style");
          const images = document.querySelectorAll("img");
          scripts.forEach((s) => s.remove());
          styles.forEach((s) => s.remove());
          images.forEach((i) => i.remove());
        });

        const descriptionElement = await this.page.$(
          '#jobDescriptionText, [class*="job-description"], div[data-testid="jobDescriptionText"]',
        );
        const rawDescription = await descriptionElement?.textContent();

        if (rawDescription) {
          const text = rawDescription.trim();
          let contractType:
            "Apprentissage" | "Professionnalisation" | "Inconnu" = "Inconnu";
          if (text.toLowerCase().includes("apprentissage")) {
            contractType = "Apprentissage";
          } else if (text.toLowerCase().includes("professionnalisation")) {
            contractType = "Professionnalisation";
          }

          jobsWithDescriptions.push({
            ...job,
            contractType,
            rawDescription: text.substring(0, 4000),
          });
        }
      } catch (error) {
        console.error("ERROR_SCRAPING_DESCRIPTION", error);
      }
    }

    return jobsWithDescriptions;
  }
}
