// lib/matching.ts

export interface MatchScoreInput {
  companyCategory: string;
  caseCategory: string;

  companyCountry?: string;
  caseCountry?: string;

  verified?: boolean;

  averageRating?: number;

  completedCases?: number;

  planType?: "FREE" | "GOLD" | "DIAMOND" | "ENTERPRISE";
}

export function calculateMatchScore(
  input: MatchScoreInput,
): number {
  let score = 0;

  // Category (60)
  if (
    input.companyCategory.trim().toLowerCase() ===
    input.caseCategory.trim().toLowerCase()
  ) {
    score += 60;
  }

  // Country (10)
  if (
    input.companyCountry &&
    input.caseCountry &&
    input.companyCountry.trim().toLowerCase() ===
      input.caseCountry.trim().toLowerCase()
  ) {
    score += 10;
  }

  // Verification (10)
  if (input.verified) {
    score += 10;
  }

  // Rating (10)
  if (input.averageRating) {
    score += Math.min(
      10,
      Math.round(input.averageRating * 2),
    );
  }

  // Experience (5)
  if ((input.completedCases ?? 0) >= 10) {
    score += 5;
  }

  // Plan (5)
  switch (input.planType) {
    case "ENTERPRISE":
      score += 5;
      break;

    case "DIAMOND":
      score += 4;
      break;

    case "GOLD":
      score += 3;
      break;

    default:
      break;
  }

  return Math.min(score, 100);
}

export function getMatchColor(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-cyan-400";
  if (score >= 60) return "text-yellow-400";
  return "text-slate-400";
}

export function getMatchLabel(score: number) {
  if (score >= 90) return "Excellent Match";
  if (score >= 75) return "Strong Match";
  if (score >= 60) return "Good Match";
  return "Low Match";
}