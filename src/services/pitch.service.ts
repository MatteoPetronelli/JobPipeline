import profileData from "../../data/user-profile.json" with { type: "json" };
import type { JobRecord } from "../models/ui.model.js";

export interface UserProfile {
  name?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  skills?: Record<string, number>;
}

export function generateOutreachPitch(job: JobRecord): {
  subject: string;
  body: string;
  mailtoUrl: string;
} {
  const profile = profileData as UserProfile;
  const name = profile.name || "Étudiant";
  const portfolio = profile.portfolioUrl || "disponible sur demande";
  const linkedIn = profile.linkedInUrl || "disponible sur demande";

  const topSkills = profile.skills
    ? Object.keys(profile.skills)
        .sort((a, b) => profile.skills![b] - profile.skills![a])
        .slice(0, 3)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(", ")
    : "React, Node.js";

  const subject = `Candidature Alternance Développeur Fullstack B3 - ${name}`;

  const body = `Bonjour,

Je me permets de vous contacter concernant l'opportunité de ${job.jobTitle} au sein de ${job.companyName}. Votre secteur d'activité et vos ambitions techniques ont particulièrement retenu mon attention.

Passionné par le développement, j'ai consolidé mes compétences sur des technologies comme ${topSkills} à travers divers projets. Je suis très motivé à l'idée d'apporter cette expertise à votre équipe tout en poursuivant mon évolution en alternance.

Vous trouverez plus de détails sur mon parcours via mon portfolio (${portfolio}) ou mon profil LinkedIn (${linkedIn}). Je serais ravi d'échanger avec vous lors d'un appel de 5 minutes.

Cordialement,
${name}`;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoUrl };
}
