import axios from "axios";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { RawJobOffer, ZaiFilterResponse } from "../models/types.js";
import { dbGet, dbRun } from "../db/database.js";

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
    return crypto
      .createHash("sha256")
      .update(`${url}-${company}`)
      .digest("hex");
  }

  public async isJobProcessed(hashId: string): Promise<boolean> {
    const row = await dbGet<{ hashId: string }>(
      "SELECT hashId FROM jobs WHERE hashId = ?",
      [hashId],
    );
    return !!row;
  }

  public applyCodeFilter(offer: RawJobOffer): string | null {
    if (
      EXCLUSION_REGEX.test(offer.description) ||
      EXCLUSION_REGEX.test(offer.title)
    ) {
      return "REJECTED_BY_CODE";
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
          content: `You are a strict job filter. Use this rule template: ${templateContent}. Reply strictly with JSON matching { "results": [ { "id": "string", "approved": boolean, "reason": "string", "techStack": ["string"], "confidenceScore": 50 } ] }.`,
        },
        {
          role: "user",
          content: JSON.stringify(offers),
        },
      ],
      response_format: { type: "json_object" },
    };

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

        const content = response.data.choices[0].message.content;
        const sanitized = cleanJsonContent(content);

        let parsedData;
        try {
          parsedData = JSON.parse(sanitized);
        } catch {
          console.warn("JSON Parse Failed. Falling back to mock evaluator.");
          return this.getMockResponse(offers);
        }

        const parsed = ZaiOutputSchema.safeParse(parsedData);
        if (!parsed.success) {
          console.warn(
            "Z.ai Output Validation Failed. Falling back to mock evaluator.",
          );
          return this.getMockResponse(offers);
        }

        return parsed.data as ZaiFilterResponse;
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          attempt++;
          if (attempt >= MAX_RETRIES) {
            console.warn(
              "MAX_RETRIES_EXCEEDED. Falling back to mock evaluator.",
            );
            return this.getMockResponse(offers);
          }
          await new Promise((res) => setTimeout(res, delay));
          delay *= 2;
        } else {
          console.warn("ZAI_API_ERROR. Falling back to mock evaluator.");
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
  ): Promise<void> {
    await dbRun(
      `INSERT INTO jobs (hashId, jobTitle, companyName, url, status, rejectionReason) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON CONFLICT(hashId) DO UPDATE SET status = excluded.status, rejectionReason = excluded.rejectionReason, updatedAt = CURRENT_TIMESTAMP`,
      [hashId, offer.title, offer.company, offer.url, status, reason],
    );
  }
}
