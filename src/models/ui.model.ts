export interface JobRecord {
  hashId: string;
  jobTitle: string;
  companyName: string;
  url: string;
  status: string;
  rejectionReason: string | null;
  generatedPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}
