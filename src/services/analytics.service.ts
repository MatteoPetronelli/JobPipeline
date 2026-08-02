import { JobRecord } from "../models/ui.model.js";

export interface PipelineAnalytics {
  totalOffers: number;
  appliedCount: number;
  interviewCount: number;
  offerCount: number;
  rejectedCount: number;
  needsFollowupCount: number;
  interviewRate: number;
  offerRate: number;
  overallConversionRate: number;
}

export function getPipelineAnalytics(jobs: JobRecord[]): PipelineAnalytics {
  const totalOffers = jobs.length;

  const appliedCount = jobs.filter((j) =>
    ["APPLIED", "NEEDS_FOLLOWUP", "INTERVIEW", "OFFER"].includes(j.status),
  ).length;

  const interviewCount = jobs.filter((j) =>
    ["INTERVIEW", "OFFER"].includes(j.status),
  ).length;

  const offerCount = jobs.filter((j) => j.status === "OFFER").length;

  const rejectedCount = jobs.filter((j) =>
    ["ARCHIVED", "REJECTED_BY_CODE"].includes(j.status),
  ).length;

  const needsFollowupCount = jobs.filter(
    (j) => j.status === "NEEDS_FOLLOWUP",
  ).length;

  const interviewRate =
    appliedCount > 0 ? (interviewCount / appliedCount) * 100 : 0;

  const offerRate =
    interviewCount > 0 ? (offerCount / interviewCount) * 100 : 0;

  const overallConversionRate =
    appliedCount > 0 ? (offerCount / appliedCount) * 100 : 0;

  return {
    totalOffers,
    appliedCount,
    interviewCount,
    offerCount,
    rejectedCount,
    needsFollowupCount,
    interviewRate,
    offerRate,
    overallConversionRate,
  };
}
