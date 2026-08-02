"use server";

import { revalidatePath } from "next/cache";
import { updateJobStatus } from "../db/queries.js";
import { sendOutreachEmail } from "../services/gmail.service.js";

export async function updateJobStatusAction(
  hashId: string,
  status: string,
  rejectionReason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateJobStatus(hashId, status, rejectionReason);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendOutreachEmailAction(
  hashId: string,
  recipientEmail: string,
  subject: string,
  bodyHtml: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!recipientEmail || !subject || !bodyHtml) {
    return { success: false, error: "Missing required fields" };
  }

  const result = await sendOutreachEmail({
    to: recipientEmail,
    subject,
    bodyHtml,
  });

  if (result.success) {
    await updateJobStatus(hashId, "APPLIED", undefined);
    revalidatePath("/");
    return { success: true, messageId: result.messageId };
  }

  return { success: false, error: result.error };
}
