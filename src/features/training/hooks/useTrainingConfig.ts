import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { useConfigurations } from "@/shared/hooks";
import { participantStatusColorPalette, statusColorPalette, statusIconPalette } from "../constants/training";

// Training categories, statuses, and participant statuses — all from configurations table
export const useTrainingConfig = () => {
  const { getValue, getNumber } = useConfigurations();

  const trainingCategories = useMemo(() => (
    getValue("training.categories", arabicSource("training.business_objectives_business_development_technical_skills_leader")).split(",").map((s) => s.trim())
  ), [getValue]);
  const trainingStatuses = useMemo(() => (
    getValue("training.statuses", arabicSource("training.upcoming_ongoing_completed_cancelled")).split(",").map((s) => s.trim())
  ), [getValue]);
  const participantStatuses = useMemo(() => (
    getValue("training.participant_statuses", arabicSource("training.registered_ongoing_completed_withdrawn")).split(",").map((s) => s.trim())
  ), [getValue]);
  const defaultWeight = getNumber("training.default_weight", 70);

  const statusColors = useMemo(() => {
    const map: Record<string, string> = {};
    trainingStatuses.forEach((s, i) => {
      map[s] = statusColorPalette[Math.min(i, statusColorPalette.length - 1)];
    });
    return map;
  }, [trainingStatuses]);

  const statusIcons = useMemo(() => {
    const map: Record<string, any> = {};
    trainingStatuses.forEach((s, i) => {
      map[s] = statusIconPalette[Math.min(i, statusIconPalette.length - 1)];
    });
    return map;
  }, [trainingStatuses]);

  const participantStatusColors = useMemo(() => {
    const map: Record<string, string> = {};
    participantStatuses.forEach((s, i) => {
      map[s] = participantStatusColorPalette[Math.min(i, participantStatusColorPalette.length - 1)];
    });
    return map;
  }, [participantStatuses]);

  const filters = useMemo(() => [arabicSource("common.all"), ...trainingCategories], [trainingCategories]);

  return {
    trainingCategories, trainingStatuses, participantStatuses, defaultWeight,
    statusColors, statusIcons, participantStatusColors, filters,
  };
};
