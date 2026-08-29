import type { DbApplicant, IrBand } from "@/shared/hooks";
import { applicantIrFallbackFields } from "../data";
import { BAND_STYLES, STAGES } from "../constants/recruitment";

/**
 * Sums the same weighted rating/stage/experience/skills components
 * `applicantIrFallbackFields` displays individually, so the two never drift
 * out of sync on their weights or caps.
 */
export const calcRankScore = function calcRankScore(a: DbApplicant): number {
  const total = applicantIrFallbackFields.reduce((sum, field) => {
    const weightFraction = parseInt(field.weight, 10) / 100;
    return sum + field.getValue(a, STAGES) * weightFraction;
  }, 0);
  return Math.round(total);
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
