import { arabicSource } from "@/i18n/source";
import type { DbTrainingParticipant, DbTrainingProgram } from "@/shared/hooks";
import { countBy } from "@/shared/utils/collections";
import { categoryColorPalette } from "../constants/training";

export interface TrainingStats {
  totalPrograms: number;
  ongoingPrograms: number;
  completedPrograms: number;
  totalParticipants: number;
  completionRate: number;
}

export const computeStats = (
  displayPrograms: DbTrainingProgram[],
  displayParticipants: DbTrainingParticipant[],
): TrainingStats => ({
  totalPrograms: displayPrograms.length,
  ongoingPrograms: displayPrograms.filter((p) => p.status === arabicSource("common.my_neighbor")).length,
  completedPrograms: displayPrograms.filter((p) => p.status === arabicSource("common.complete")).length,
  totalParticipants: displayParticipants.length,
  completionRate: displayParticipants.length > 0
    ? Math.round((displayParticipants.filter((p) => p.completion_status === arabicSource("common.complete")).length / displayParticipants.length) * 100)
    : 0,
});

const MONTHLY_HOURS_MONTHS = () => [
  arabicSource("common.january"), arabicSource("common.february"), arabicSource("common.march"),
  arabicSource("common.april"), arabicSource("common.may"), arabicSource("common.jun"),
];

/** Bucket programs by start month in a single pass instead of one filter per month. */
export const computeMonthlyHours = (programs: DbTrainingProgram[]) => {
  const months = MONTHLY_HOURS_MONTHS();
  const counts = new Array<number>(months.length).fill(0);
  const hours = new Array<number>(months.length).fill(0);

  for (const p of programs) {
    if (!p.start_date) continue;
    const monthIndex = new Date(p.start_date).getMonth();
    if (monthIndex < 0 || monthIndex >= months.length) continue;
    counts[monthIndex] += 1;
    hours[monthIndex] += p.duration ? parseInt(p.duration) || 0 : 0;
  }

  return months.map((month, idx) => ({
    month,
    hours: hours[idx] || counts[idx] * 20,
  }));
};

export const computeCategoryDistribution = (programs: DbTrainingProgram[], trainingCategories: string[]) => {
  const countsByCategory = countBy(programs, (p) => p.category);
  const counts = trainingCategories.map((cat) => ({ cat, count: countsByCategory.get(cat) ?? 0 }));
  const total = counts.reduce((s, c) => s + c.count, 0) || 1;
  return counts.map((c, i) => ({
    name: `${c.cat} (${Math.round((c.count / total) * 100)}%)`,
    value: (c.count / total) * 100,
    color: categoryColorPalette[i % categoryColorPalette.length],
  }));
};
