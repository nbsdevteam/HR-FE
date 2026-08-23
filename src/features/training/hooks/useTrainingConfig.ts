import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useConfigurations } from "@/shared/hooks";
import { buildStatusColorMap, buildStatusValueMap } from "@/shared/utils/statusColors";
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

  const statusColors = useMemo(
    () => buildStatusColorMap(trainingStatuses, statusColorPalette),
    [trainingStatuses],
  );

  const statusIcons = useMemo(
    () => buildStatusValueMap<LucideIcon>(trainingStatuses, statusIconPalette),
    [trainingStatuses],
  );

  const participantStatusColors = useMemo(
    () => buildStatusColorMap(participantStatuses, participantStatusColorPalette),
    [participantStatuses],
  );

  const filters = useMemo(() => [arabicSource("common.all"), ...trainingCategories], [trainingCategories]);

  return {
    trainingCategories, trainingStatuses, participantStatuses, defaultWeight,
    statusColors, statusIcons, participantStatusColors, filters,
  };
};
