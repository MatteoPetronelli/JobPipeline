export interface RawJobOffer {
  url: string;
  title: string;
  company: string;
  description: string;
}

export interface ZaiFilterResponse {
  results: {
    id: string;
    approved: boolean;
    reason: string;
  }[];
}

export interface JobOffer {
  url: string;
  jobTitle: string;
  companyName: string;
  rawDescription: string;
  status?: string;
  hashId?: string;
  score?: number;
}
