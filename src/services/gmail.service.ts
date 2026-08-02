import { google } from "googleapis";

export interface EmailPayload {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function createRawEmail(options: EmailPayload): string {
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(options.subject).toString("base64")}?=`;
  const from = process.env.GMAIL_USER_EMAIL || "me";

  const messageParts = [
    `To: ${options.to}`,
    `From: ${from}`,
    `Subject: ${subjectEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    options.bodyHtml,
  ];

  const mimeString = messageParts.join("\n");
  return Buffer.from(mimeString).toString("base64url");
}

export async function sendOutreachEmail(
  payload: EmailPayload,
): Promise<EmailResult> {
  try {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return {
        success: false,
        error: "Missing Gmail API environment variables",
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground",
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const encodedMessage = createRawEmail(payload);

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      success: true,
      messageId: response.data.id || undefined,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
