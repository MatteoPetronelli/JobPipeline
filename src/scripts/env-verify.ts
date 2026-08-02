import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  ZAI_API_KEY: z.string().min(1),
  ZAI_MODEL: z.string().min(1),
  GMAIL_CLIENT_ID: z.string().min(1),
  GMAIL_CLIENT_SECRET: z.string().min(1),
  GMAIL_REFRESH_TOKEN: z.string().min(1),
  GMAIL_USER_EMAIL: z.string().min(1),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.warn("WARNING: Missing or invalid environment variables:");
  console.warn(result.error.format());
  console.warn("The application may run in mock/fallback mode.");
}

process.exit(0);
