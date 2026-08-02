import axios from "axios";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { RawJobOffer, ZaiFilterResponse } from "../models/types.js";
import { dbGet, dbRun, dbAll } from "../db/database.js";

const ZAI_API_URL = "https://api.z.ai/api/coding/paas/v4/chat/completions";
const EXCLUSION_REGEX =
  /(master|bac\+5|bac\+4|m1|m2|école d'ingénieur|stage|cdi|php|symfony|openclassrooms|simplon|epitech|canada)/i;
const INITIAL_BACKOFF = 10000;
const MAX_RETRIES = 3;

const ZaiOutputSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      approved: z.boolean(),
      reason: z.string(),
      techStack: z.array(z.string()).default([]),
      confidenceScore: z.number().min(0).max(100).default(50),
    }),
  ),
});

function cleanJsonContent(rawText: string): string {
  return rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export class FilterEngine {
  public generateHashId(url: string, company: string): string {
    let cleanUrl: string;
    try {
      const parsed = new URL(url);
      ["utm_source", "utm_medium", "utm_campaign", "ref", "jk", "from"].forEach(
        (p) => parsed.searchParams.delete(p),
      );
      cleanUrl = parsed.toString();
    } catch {
      cleanUrl = url.split("?")[0];
    }
    return crypto
      .createHash("sha256")
      .update(`${cleanUrl}-${company}`)
      .digest("hex");
  }

  public async isJobProcessed(hashId: string): Promise<boolean> {
    const row = await dbGet<{ hashId: string }>(
      "SELECT hashId FROM jobs WHERE hashId = ?",
      [hashId],
    );
    return !!row;
  }

  public async isDuplicateJob(
    title: string,
    company: string,
  ): Promise<boolean> {
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normTitle = normalize(title);
    const normCompany = normalize(company);

    const rows = await dbAll<{ jobTitle: string; companyName: string }>(
      "SELECT jobTitle, companyName FROM jobs",
    );
    return rows.some(
      (r) =>
        normalize(r.jobTitle) === normTitle &&
        normalize(r.companyName) === normCompany,
    );
  }

  public isSchoolOrTraining(
    title: string,
    company: string,
    description: string,
  ): boolean {
    const schoolRegex =
      /(cfa|studi|openclassrooms|cesi|pigier|wild code school|grande école|esci|formations|campus|efrei|iscod|esgi|epitech)/i;
    if (schoolRegex.test(company) || schoolRegex.test(title)) return true;

    const phraseRegex =
      /(rejoignez notre école|formation financée|titre rncp)/i;
    if (phraseRegex.test(description) || phraseRegex.test(title)) return true;

    return false;
  }

  public isAcceptableLocation(
    locationStr: string | undefined,
    description: string,
  ): boolean {
    const remoteRegex =
      /(100%\s*télétravail|full\s*remote|télétravail\s*total|remote\s*complet|télétravail\s*à\s*100%|100%\s*remote)/i;
    if (
      remoteRegex.test(description) ||
      (locationStr && remoteRegex.test(locationStr))
    ) {
      return true;
    }

    const idfRegex =
      /(paris|île-de-france|ile-de-france|yvelines|78|hauts-de-seine|92|val-d'oise|val\s*d'oise|95|seine-saint-denis|93|val-de-marne|94|essonne|91|seine-et-marne|77|idf|la\s*défense|cergy)/i;

    if (locationStr) {
      if (idfRegex.test(locationStr)) {
        return true;
      }

      const provincialRegex =
        /(strasbourg|lyon|lille|nantes|bordeaux|toulouse|marseille|rennes|montpellier|67|69|59|44|31|13|33|34|35)/i;
      if (provincialRegex.test(locationStr)) {
        return false;
      }
    }

    return true;
  }

  public applyCodeFilter(offer: RawJobOffer): string | null {
    if (
      EXCLUSION_REGEX.test(offer.description) ||
      EXCLUSION_REGEX.test(offer.title)
    ) {
      return "REJECTED";
    }

    if (
      this.isSchoolOrTraining(offer.title, offer.company, offer.description)
    ) {
      return "REJECTED_SCHOOL_OR_TRAINING";
    }

    if (!this.isAcceptableLocation(offer.location, offer.description)) {
      return "Lieu de travail hors Île-de-France et non 100% remote";
    }

    return null;
  }

  private getMockResponse(
    offers: { id: string; description: string }[],
  ): ZaiFilterResponse {
    return {
      results: offers.map((offer) => ({
        id: offer.id,
        approved: true,
        reason: "Heuristic Mock Fallback",
        techStack: [],
        confidenceScore: 50,
      })),
    };
  }

  public async callZaiBatchFilter(
    offers: { id: string; description: string }[],
  ): Promise<ZaiFilterResponse> {
    const apiKey = process.env.ZAI_API_KEY;
    if (!apiKey || apiKey.includes("mock") || apiKey === "fake") {
      await new Promise((res) => setTimeout(res, 500));
      return this.getMockResponse(offers);
    }

    const templatePath = path.resolve(
      process.cwd(),
      ".agents/skills/batch-filter/filter-template.json",
    );
    const templateContent = await fs.readFile(templatePath, "utf-8");

    const payload = {
      model: process.env.ZAI_MODEL || "glm-5.2",
      messages: [
        {
          role: "system",
          content: `You are a strict job filter. Use this rule template: ${templateContent}. CRITICAL LOCATION RULE: The candidate lives in Mareil-Marly (Île-de-France, 78). Reject any job physically located outside Île-de-France (e.g. Strasbourg, Lyon, Nantes, Lille, etc.) EVEN IF partial remote (1 or 2 days/week) is offered. ONLY approve non-IDF jobs if they are explicitly 100% Full Remote / Télétravail total. Distinguish between the company's general list of national offices and the ACTUAL target location of the offer. REJECT any job posting submitted by a training center, school, or CFA advertising a degree/course instead of a genuine employer offering a direct hiring contract. Reply strictly with JSON matching { "results": [ { "id": "string", "approved": boolean, "reason": "string", "techStack": ["string"], "confidenceScore": 50 } ] }.`,
        },
        {
          role: "user",
          content: JSON.stringify(offers),
        },
      ],
      response_format: { type: "json_object" },
    };

    console.log(`[Z.ai] Dispatching request for ${offers.length} job(s)...`);

    let attempt = 0;
    let delay = INITIAL_BACKOFF;

    while (attempt < MAX_RETRIES) {
      try {
        const response = await axios.post(ZAI_API_URL, payload, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        console.log(`[Z.ai] Response Status: ${response.status}`);

        const content = response.data.choices[0].message.content;
        const sanitized = cleanJsonContent(content);

        let parsedData;
        try {
          parsedData = JSON.parse(sanitized);
        } catch {
          console.error(
            "[Z.ai] JSON Parse Failed. Falling back to mock evaluator.",
          );
          return this.getMockResponse(offers);
        }

        const parsed = ZaiOutputSchema.safeParse(parsedData);
        if (!parsed.success) {
          console.error(
            "[Z.ai] Validation Failed. Falling back to mock evaluator.",
          );
          return this.getMockResponse(offers);
        }

        return parsed.data as ZaiFilterResponse;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            console.error(`[Z.ai] HTTP 429 Rate Limit Exceeded`);
            attempt++;
            if (attempt >= MAX_RETRIES) {
              console.error(
                "[Z.ai] MAX_RETRIES_EXCEEDED. Falling back to mock evaluator.",
              );
              return this.getMockResponse(offers);
            }
            await new Promise((res) => setTimeout(res, delay));
            delay *= 2;
          } else {
            console.error(
              `[Z.ai] HTTP Error: ${error.response?.status} - ${JSON.stringify(error.response?.data || error.message)}`,
            );
            return this.getMockResponse(offers);
          }
        } else {
          console.error(`[Z.ai] Unknown Error: ${error}`);
          return this.getMockResponse(offers);
        }
      }
    }

    return this.getMockResponse(offers);
  }

  public async persistJobStatus(
    hashId: string,
    offer: RawJobOffer,
    status: string,
    reason: string | null,
    generatedPrompt: string | null = null,
  ): Promise<void> {
    await dbRun(
      `INSERT INTO jobs (hashId, jobTitle, companyName, url, status, rejectionReason, generatedPrompt) 
       VALUES (?, ?, ?, ?, ?, ?, ?) 
       ON CONFLICT(hashId) DO UPDATE SET status = excluded.status, rejectionReason = excluded.rejectionReason, generatedPrompt = COALESCE(excluded.generatedPrompt, jobs.generatedPrompt), updatedAt = CURRENT_TIMESTAMP`,
      [
        hashId,
        offer.title,
        offer.company,
        offer.url,
        status,
        reason,
        generatedPrompt,
      ],
    );
  }
}
