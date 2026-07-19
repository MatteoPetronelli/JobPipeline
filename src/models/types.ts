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
