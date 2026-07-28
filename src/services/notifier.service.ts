import dotenv from "dotenv";
import type { JobOffer } from "../models/types.js";

dotenv.config();

export async function sendJobNotification(offers: JobOffer[]): Promise<void> {
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  const telegramUrl = process.env.TELEGRAM_WEBHOOK_URL;

  if (!discordUrl && !telegramUrl) {
    console.warn("Notification URLs missing. Bypassing dispatch.");
    return;
  }

  const validOffers = offers.filter(
    (o) => o.status === "HIGH_MATCH" || o.status === "APPROVED_BY_ZAI",
  );

  for (const offer of validOffers) {
    const payload = {
      content: `New Match: ${offer.jobTitle} at ${offer.companyName}`,
      embeds: [
        {
          title: offer.jobTitle,
          url: offer.url,
          description: `Score: ${offer.score ?? "N/A"} - Status: ${offer.status}`,
          color: 3447003,
        },
      ],
    };

    if (discordUrl) {
      try {
        await fetch(discordUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("Discord notification failed", error);
      }
    }

    if (telegramUrl) {
      try {
        const tgPayload = {
          text: `New Match: ${offer.jobTitle} at ${offer.companyName}\nUrl: ${offer.url}\nScore: ${offer.score ?? "N/A"}`,
        };
        await fetch(telegramUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tgPayload),
        });
      } catch (error) {
        console.error("Telegram notification failed", error);
      }
    }
  }
}
