export interface RawJobOffer {
  url: string;
  title: string;
  company: string;
  description: string;
  location?: string;
}

export interface ZaiFilterResponse {
  results: {
    hashId: string;
    approved: boolean;
    reason: string;
    matchScore: number;
    pitch?: string;
  }[];
}

export type JobStatus =
  | "NEW"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "HIGH_MATCH"
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "ARCHIVED"
  | "NEEDS_FOLLOWUP"
  | string;

export interface JobOffer {
  url: string;
  jobTitle: string;
  companyName: string;
  rawDescription: string;
  status?: JobStatus;
  hashId?: string;
  score?: number;
}
