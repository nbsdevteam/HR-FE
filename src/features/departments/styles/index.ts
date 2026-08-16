import { arabicSource } from "@/i18n/source";

export const avatarColors = [
  "#8B5CF6", "#22C55E", "#3B82F6", "#06B6D4", "#EC4899", "#EF4444",
  "#F59E0B", "#14B8A6", "#F97316", "#6366F1", "#A855F7", "#10B981",
  "#0EA5E9", "#D946EF", "#84CC16", "#F43F5E", "#2DD4BF", "#FB923C",
  "#7C3AED", "#059669", "#E11D48", "#0891B2", "#CA8A04", "#9333EA",
];

export const OWNER_COLOR = "#FFD700";

export const CLEVEL_COLOR = "#7C3AED";

export const defaultDeptColorMap: Record<string, string> = {
  [arabicSource("common.senior_management")]: CLEVEL_COLOR,
  [arabicSource("common.information_technology")]: "#06B6D4",
  IT: "#06B6D4",
  [arabicSource("common.finance")]: "#3B82F6",
  [arabicSource("common.marketing")]: "#EC4899",
  [arabicSource("common.human_resources")]: "#F43F5E",
  [arabicSource("common.operations")]: "#EF4444",
  [arabicSource("common.sales")]: "#F59E0B",
  [arabicSource("common.owner")]: OWNER_COLOR,
};
