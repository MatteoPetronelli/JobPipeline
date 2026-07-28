import fs from "fs";
import path from "path";
import type { JobOffer } from "../models/types.js";

interface UserProfile {
  targetRoles: string[];
  skills: Record<string, number>;
  contractTypes: string[];
  locations: string[];
  blacklistedCompanies: string[];
  blacklistedKeywords: string[];
}

export function calculateMatchScore(job: JobOffer): {
  score: number;
  matchedKeywords: string[];
} {
  const profilePath = path.resolve(process.cwd(), "data/user-profile.json");
  const profileData = fs.readFileSync(profilePath, "utf-8");
  const profile = JSON.parse(profileData) as UserProfile;

  let score = 0;
  const matchedKeywords: string[] = [];

  const textToSearch = `${job.jobTitle} ${job.rawDescription}`.toLowerCase();

  for (const blacklist of profile.blacklistedCompanies) {
    if (job.companyName.toLowerCase().includes(blacklist.toLowerCase())) {
      return { score: 0, matchedKeywords: [] };
    }
  }

  for (const blacklist of profile.blacklistedKeywords) {
    if (textToSearch.includes(blacklist.toLowerCase())) {
      return { score: 0, matchedKeywords: [] };
    }
  }

  for (const [skill, weight] of Object.entries(profile.skills)) {
    if (textToSearch.includes(skill.toLowerCase())) {
      score += weight;
      matchedKeywords.push(skill);
    }
  }

  const maxScore = Object.values(profile.skills).reduce((a, b) => a + b, 0);
  let finalScore = 0;

  if (maxScore > 0) {
    finalScore = Math.min(100, Math.round((score / maxScore) * 100));
  }

  return { score: finalScore, matchedKeywords };
}
