import { arabicSource } from "@/i18n/source";
import type { DbTrainingParticipant, DbTrainingProgram } from "@/shared/hooks";
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

export const computeMonthlyHours = (programs: DbTrainingProgram[]) => (
  MONTHLY_HOURS_MONTHS().map((month, idx) => {
    const programsInMonth = programs.filter((p) => {
      if (!p.start_date) return false;
      return new Date(p.start_date).getMonth() === idx;
    });
    const totalHours = programsInMonth.reduce((sum, p) => sum + (p.duration ? parseInt(p.duration) : 0), 0);
    return { month, hours: totalHours || programsInMonth.length * 20 };
  })
);

export const computeCategoryDistribution = (programs: DbTrainingProgram[], trainingCategories: string[]) => {
  const counts = trainingCategories.map((cat) => ({
    cat,
    count: programs.filter((p) => p.category === cat).length,
  }));
  const total = counts.reduce((s, c) => s + c.count, 0) || 1;
  return counts.map((c, i) => ({
    name: `${c.cat} (${Math.round((c.count / total) * 100)}%)`,
    value: (c.count / total) * 100,
    color: categoryColorPalette[i % categoryColorPalette.length],
  }));
};
