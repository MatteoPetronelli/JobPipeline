import { z } from "zod";

export const jobSchema = z.object({
  jobTitle: z.string(),
  companyName: z.string(),
  location: z.string().optional(),
  contractType: z
    .enum(["Apprentissage", "Professionnalisation", "Inconnu"])
    .optional(),
  url: z.string().url(),
  rawDescription: z.string(),
  status: z
    .enum([
      "NEW",
      "PENDING_REVIEW",
      "APPROVED_BY_ZAI",
      "REJECTED_BY_CODE",
      "HIGH_MATCH",
      "APPLIED",
      "INTERVIEW",
      "OFFER",
      "ARCHIVED",
      "NEEDS_FOLLOWUP",
    ])
    .optional(),
});

export type Job = z.infer<typeof jobSchema>;
