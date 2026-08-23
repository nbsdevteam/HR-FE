import type { DbApplicant, IrBand } from "@/shared/hooks";
import { BAND_STYLES, STAGES } from "../constants/recruitment";

export const calcRankScore = function calcRankScore(a: DbApplicant): number {
  // Rating weight: 40%
  const ratingScore = (a.rating / 5) * 40;
  // Stage progress weight: 20%
  const stageIdx = (STAGES as readonly string[]).indexOf(a.stage);
  const stageScore = stageIdx >= 0 ? (stageIdx / (STAGES.length - 1)) * 20 : 0;
  // Experience weight: 25%
  const expScore = Math.min(a.experience_years / 15, 1) * 25;
  // Skills count weight: 15%
  const skillsCount = a.skills?.length || 0;
  const skillsScore = Math.min(skillsCount / 8, 1) * 15;
  return Math.round(ratingScore + stageScore + expScore + skillsScore);
}

/** True when the backend produced a real Initial Rating for this applicant. */
export const hasIr = function hasIr(a: DbApplicant): boolean {
  return a.ir_status === "done" && typeof a.ir_score === "number" && a.ir_score > 0;
}

/** The score to sort and display by: the AI's IR when present, else the estimate. */
export const effectiveScore = function effectiveScore(a: DbApplicant): number {
  return hasIr(a) ? Math.round(a.ir_score as number) : calcRankScore(a);
}

export const bandFromScore = function bandFromScore(score: number): Exclude<IrBand, ""> {
  if (score >= 80) return "excellent";
  if (score >= 65) return "strong";
  if (score >= 50) return "moderate";
  if (score >= 35) return "weak";
  return "unfit";
}

export const rankLabel = function rankLabel(score: number, band?: IrBand): { text: string; color: string } {
  return BAND_STYLES[band || bandFromScore(score)];
}

/** Arabic labels for the IR component keys returned by the backend. */
