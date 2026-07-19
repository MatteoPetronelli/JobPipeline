import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  ZAI_API_KEY: z.string().min(1),
  GMAIL_CLIENT_ID: z.string().min(1),
  GMAIL_CLIENT_SECRET: z.string().min(1),
  GMAIL_REFRESH_TOKEN: z.string().min(1),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(result.error.format());
  process.exit(1);
}

process.exit(0);
