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
});

export type Job = z.infer<typeof jobSchema>;
