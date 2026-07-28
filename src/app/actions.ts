"use server";

import { revalidatePath } from "next/cache";
import { updateJobStatus } from "../db/queries.js";

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
