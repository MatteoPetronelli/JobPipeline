import { dbAll, dbGet, dbRun } from "./database.js";
import type { Job } from "../models/job.model.js";

export interface DashboardStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  needsFollowup: number;
}

export interface JobRow extends Pick<Job, "jobTitle" | "companyName" | "url"> {
  hashId: string;
  status: string;
  rejectionReason: string | null;
  generatedPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const result = await dbGet<{
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    needsFollowup: number;
  }>(`
    SELECT
      CAST(COUNT(*) AS INTEGER) as total,
      CAST(SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS INTEGER) as approved,
      CAST(SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) AS INTEGER) as rejected,
      CAST(SUM(CASE WHEN status IN ('NEW', 'PENDING') THEN 1 ELSE 0 END) AS INTEGER) as pending,
      CAST(SUM(CASE WHEN status = 'NEEDS_FOLLOWUP' THEN 1 ELSE 0 END) AS INTEGER) as needsFollowup
    FROM jobs
  `);

  if (!result) {
    return { total: 0, approved: 0, rejected: 0, pending: 0, needsFollowup: 0 };
  }

  return {
    total: result.total || 0,
    approved: result.approved || 0,
    rejected: result.rejected || 0,
    pending: result.pending || 0,
    needsFollowup: result.needsFollowup || 0,
  };
};

export const getFilteredOffers = async (filters: {
  status?: string;
  search?: string;
}): Promise<JobRow[]> => {
  let query = "SELECT * FROM jobs";
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (filters.search) {
    conditions.push("(jobTitle LIKE ? OR companyName LIKE ?)");
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY createdAt DESC, hashId DESC";

  return await dbAll<JobRow>(query, params);
};

export const updateJobStatus = async (
  id: number | string,
  status: string,
  rejectionReason?: string,
): Promise<void> => {
  if (status === "APPLIED") {
    const now = new Date().toISOString();
    if (rejectionReason !== undefined) {
      await dbRun(
        "UPDATE jobs SET status = ?, rejectionReason = ?, updatedAt = CURRENT_TIMESTAMP, appliedAt = COALESCE(appliedAt, ?) WHERE hashId = ?",
        [status, rejectionReason, now, id],
      );
    } else {
      await dbRun(
        "UPDATE jobs SET status = ?, updatedAt = CURRENT_TIMESTAMP, appliedAt = COALESCE(appliedAt, ?) WHERE hashId = ?",
        [status, now, id],
      );
    }
  } else {
    if (rejectionReason !== undefined) {
      await dbRun(
        "UPDATE jobs SET status = ?, rejectionReason = ?, updatedAt = CURRENT_TIMESTAMP WHERE hashId = ?",
        [status, rejectionReason, id],
      );
    } else {
      await dbRun(
        "UPDATE jobs SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE hashId = ?",
        [status, id],
      );
    }
  }
};
