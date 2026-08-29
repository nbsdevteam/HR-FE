import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";

const WARNING_COLORS = ["#F59E0B", "#F97316", "#EF4444", "#DC2626", "#991B1B"];

// ═══════ CHART DATA ═══════
export const useDashboardChartData = (
  tenureStats: { under1: number; y1to3: number; y3to5: number; over5: number },
  warningStats: { byType: Record<string, number> },
) => {
  // Memoized because this array is a dependency of the aggregated section
  // payload — an unmemoized literal re-created the whole payload every render.
  const tenureDistribution = useMemo(() => [
    { name: arabicSource("dashboard.less_than_a_year"), value: tenureStats.under1, color: "#3B82F6" },
    { name: arabicSource("dashboard.1_3_years"), value: tenureStats.y1to3, color: "#22C55E" },
    { name: arabicSource("dashboard.3_5_years"), value: tenureStats.y3to5, color: "#D4AF37" },
    { name: arabicSource("dashboard.more_than_5"), value: tenureStats.over5, color: "#8B5CF6" },
  ], [tenureStats]);

  const warningDistribution = useMemo(() => {
    return Object.entries(warningStats.byType).map(([name, value], i) => ({
      name, value, color: WARNING_COLORS[i] || "#EF4444",
    }));
  }, [warningStats]);

  return { tenureDistribution, warningDistribution };
};
