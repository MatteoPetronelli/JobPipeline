import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import { Browser, BrowserContext, Page } from "playwright";
import { Job } from "../models/job.model.js";
import os from "os";
import path from "path";

chromium.use(stealth());

export class JobScraperService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  public async initialize(headless: boolean = true): Promise<void> {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const userDataDir = path.join(os.tmpdir(), "playwright_user_data");
    this.context = await chromium.launchPersistentContext(userDataDir, {
      headless,
      userAgent,
      locale: "fr-FR",
      timezoneId: "Europe/Paris",
    });

    const pages = this.context.pages();
    this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
  }
  public async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
  }

  private extractLdJsonDescription(scripts: (string | null)[]): string {
    for (const scriptContent of scripts) {
      if (!scriptContent) continue;
      try {
        const data = JSON.parse(scriptContent) as unknown;
        if (typeof data === "object" && data !== null) {
          const record = data as Record<string, unknown>;
          if (
            record["@type"] === "JobPosting" &&
            typeof record.description === "string"
          ) {
            return record.description;
          }
        }
        if (Array.isArray(data)) {
          for (const item of data) {
            if (typeof item === "object" && item !== null) {
              const record = item as Record<string, unknown>;
              if (
                record["@type"] === "JobPosting" &&
                typeof record.description === "string"
              ) {
                return record.description;
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }
    return "";
  }

  private findWttjJobsNextData(obj: unknown, results: Job[]): void {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.findWttjJobsNextData(item, results);
      }
      return;
    }

    const record = obj as Record<string, unknown>;
    if (
      typeof record.slug === "string" &&
      typeof record.name === "string" &&
      typeof record.organization === "object" &&
      record.organization !== null
    ) {
      const org = record.organization as Record<string, unknown>;
      if (typeof org.name === "string" && typeof org.slug === "string") {
        const fullUrl = `https://www.welcometothejungle.com/fr/companies/${org.slug}/jobs/${record.slug}`;

        let locationText = undefined;
        if (typeof record.office === "object" && record.office !== null) {
          locationText = (record.office as Record<string, unknown>)
            .name as string;
        }

        results.push({
          jobTitle: record.name.trim(),
          companyName: org.name.trim(),
          location: locationText?.trim(),
          contractType: "Inconnu",
          url: fullUrl,
          rawDescription: "",
        });
        return;
      }
    }

    for (const key of Object.keys(record)) {
      this.findWttjJobsNextData(record[key], results);
    }
  }

  private findWttjDescriptionNextData(obj: unknown): string {
    if (!obj || typeof obj !== "object") return "";
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const res = this.findWttjDescriptionNextData(item);
        if (res) return res;
      }
      return "";
    }
    const record = obj as Record<string, unknown>;
    if (
      typeof record.description === "string" &&
      record.description.length > 50
    ) {
      return record.description;
    }
    for (const key of Object.keys(record)) {
      const res = this.findWttjDescriptionNextData(record[key]);
      if (res) return res;
    }
    return "";
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
    const baseSearchUrl = `https://fr.indeed.com/jobs?q=${encodeURIComponent(searchQuery)}&l=78750&radius=25&sort=date`;

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
        throw new Error("CloudflareBlocked");
      }

      const title = await this.page.title();
      if (
        title.toLowerCase().includes("just a moment") ||
        title.toLowerCase().includes("cloudflare")
      ) {
        console.warn("CLOUDFLARE_DETECTED");
        throw new Error("CloudflareBlocked");
      }

      await this.page.waitForTimeout(2000);
      await this.page.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight),
      );
      await this.page.waitForTimeout(1500);

      const jobCards = await this.page.$$(
        'a[id^="job_"], div.job_seen_beacon, td.resultContent',
      );
      if (jobCards.length === 0) {
        break;
      }

      for (const card of jobCards) {
        try {
          const titleElement = await card.$(
            'h2.jobTitle span, h3.jobTitle span, [class*="jobTitle"] span, [role="heading"] span, h2.jobTitle, .jobTitle',
          );
          let titleText = await titleElement?.textContent();

          const companyElement = await card.$(
            'span[data-testid="company-name"], [data-company-name="true"], span.companyName, [data-testid="text-company"]',
          );
          const companyText = await companyElement?.textContent();

          const locationElement = await card.$(
            'div[data-testid="text-location"], [data-testid="location"], div.companyLocation',
          );
          const locationText = await locationElement?.textContent();

          let linkElement = await card.$("a.jcs-JobTitle, a[data-jk]");
          if (!linkElement) {
            const tagName = await card.evaluate((el) =>
              el.tagName.toLowerCase(),
            );
            if (tagName === "a") {
              linkElement = card;
            }
          }
          const href = await linkElement?.getAttribute("href");

          if (!titleText && linkElement) {
            const ariaLabel = await linkElement.getAttribute("aria-label");
            const spanText = await linkElement.$eval("span", (el) => el.textContent).catch(() => "");
            titleText = spanText || ariaLabel || await linkElement.textContent();
          }

          if (!titleText || !companyText || !href) {
            console.warn(
              `[SELECTOR_DEPRECATED] Indeed: title=${!!titleText}, company=${!!companyText}, href=${!!href}`,
            );
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
          console.error(
            "ERROR_SCRAPING",
            error instanceof Error ? error.message : String(error),
          );
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
          throw new Error("CloudflareBlocked");
        }

        const title = await this.page.title();
        if (
          title.toLowerCase().includes("just a moment") ||
          title.toLowerCase().includes("cloudflare")
        ) {
          throw new Error("CloudflareBlocked");
        }

        const ldJsonScripts = await this.page.$$eval(
          'script[type="application/ld+json"]',
          (scripts) => scripts.map((s) => s.textContent),
        );
        let rawDescription = this.extractLdJsonDescription(ldJsonScripts);

        if (!rawDescription) {
          const descriptionElement = await this.page.$(
            '#jobDescriptionText, [class*="job-description"], div[data-testid="jobDescriptionText"]',
          );
          rawDescription = (await descriptionElement?.textContent()) || "";
        }

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
        console.error(
          "ERROR_SCRAPING_DESCRIPTION",
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return jobsWithDescriptions;
  }

  public async scrapeWelcomeToTheJungle(
    searchQuery: string,
    maxPages: number,
  ): Promise<Job[]> {
    if (!this.page) {
      throw new Error("ScraperNotInitialized");
    }

    const jobs: Job[] = [];
    let currentPage = 1;
    const baseSearchUrl = `https://www.welcometothejungle.com/fr/jobs?query=${encodeURIComponent(searchQuery)}&aroundQuery=Paris`;

    while (currentPage <= maxPages) {
      const url =
        currentPage === 1
          ? baseSearchUrl
          : `${baseSearchUrl}&page=${currentPage}`;

      const response = await this.page.goto(url, {
        waitUntil: "domcontentloaded",
      });
      if (response?.status() === 403 || response?.status() === 429) {
        console.warn("FAILED_TEMPORARY");
        break;
      }

      await this.page.waitForTimeout(3000);

      const nextDataStr = await this.page.evaluate(() => {
        const el = document.getElementById("__NEXT_DATA__");
        return el ? el.textContent : null;
      });

      const currentJobsCount = jobs.length;

      if (nextDataStr) {
        try {
          const nextData = JSON.parse(nextDataStr) as unknown;
          this.findWttjJobsNextData(nextData, jobs);
        } catch {
          // ignore
        }
      }

      if (jobs.length === currentJobsCount) {
        const jobCards = await this.page.$$(
          'article, div[data-testid="search-results-list-item-wrapper"], li[data-testid="search-results-list-item-wrapper"], li[class*="ais-Hits-item"]',
        );

        for (const card of jobCards) {
          try {
            const titleElement = await card.$(
              'h4, [data-testid="job-card-title"], [role="heading"]',
            );
            const titleText = await titleElement?.textContent();

            const companyElement = await card.$(
              'span[data-testid="job-card-company"], [class*="company"]',
            );
            const companyText = await companyElement?.textContent();

            const locationElement = await card.$(
              'span[data-testid="job-card-location"], [class*="location"]',
            );
            const locationText = await locationElement?.textContent();

            const linkElement = await card.$('a[href*="/jobs/"], a');
            const href = await linkElement?.getAttribute("href");

            if (!titleText || !companyText || !href) {
              console.warn(
                `[SELECTOR_DEPRECATED] WTTJ: title=${!!titleText}, company=${!!companyText}, href=${!!href}`,
              );
              continue;
            }

            const fullUrl = href.startsWith("http")
              ? href
              : `https://www.welcometothejungle.com${
                  href.startsWith("/") ? "" : "/"
                }${href}`;

            jobs.push({
              jobTitle: titleText.trim(),
              companyName: companyText.trim(),
              location: locationText?.trim(),
              contractType: "Inconnu",
              url: fullUrl,
              rawDescription: "",
            });
          } catch (error) {
            console.error(
              "ERROR_SCRAPING",
              error instanceof Error ? error.message : String(error),
            );
          }
        }
      }

      if (jobs.length === currentJobsCount) {
        break;
      }

      currentPage++;
    }

    const jobsWithDescriptions: Job[] = [];

    for (const job of jobs) {
      try {
        const response = await this.page.goto(job.url, {
          waitUntil: "domcontentloaded",
        });

        if (response?.status() === 403 || response?.status() === 429) {
          console.warn("FAILED_TEMPORARY");
          break;
        }

        await this.page.waitForTimeout(1000);

        let rawDescription = "";

        const ldJsonScripts = await this.page.$$eval(
          'script[type="application/ld+json"]',
          (scripts) => scripts.map((s) => s.textContent),
        );
        rawDescription = this.extractLdJsonDescription(ldJsonScripts);

        if (!rawDescription) {
          const nextDataStr = await this.page.evaluate(() => {
            const el = document.getElementById("__NEXT_DATA__");
            return el ? el.textContent : null;
          });
          if (nextDataStr) {
            try {
              const nextData = JSON.parse(nextDataStr) as unknown;
              rawDescription = this.findWttjDescriptionNextData(nextData);
            } catch {
              // ignore
            }
          }
        }

        if (!rawDescription) {
          const descriptionElement = await this.page.$(
            '[data-testid="job-section-description"], [class*="description"]',
          );
          rawDescription = (await descriptionElement?.textContent()) || "";
        }

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
        console.error(
          "ERROR_SCRAPING_DESCRIPTION",
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return jobsWithDescriptions;
  }
}
