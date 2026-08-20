import { useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import { normalizeLeaveStatus } from "@/i18n/status";

// ═══════ CHART DATA ═══════
export const useDashboardChartData = (
  leaveRequests: any[],
  pendingLeaves: number,
  approvedLeaves: number,
  tenureStats: { under1: number; y1to3: number; y3to5: number; over5: number },
  warningStats: { byType: Record<string, number> },
) => {
  const leaveDistribution = useMemo(() => [
    { name: arabicSource("common.pending_2"), value: pendingLeaves, color: "#F59E0B" },
    { name: arabicSource("common.agreed"), value: approvedLeaves, color: "#22C55E" },
    { name: arabicSource("common.rejected"), value: leaveRequests.filter(r => normalizeLeaveStatus(r.status) === arabicSource("common.rejected_3")).length, color: "#DC2626" },
  ], [leaveRequests, pendingLeaves, approvedLeaves]);

  const tenureDistribution = [
    { name: arabicSource("dashboard.less_than_a_year"), value: tenureStats.under1, color: "#3B82F6" },
    { name: arabicSource("dashboard.1_3_years"), value: tenureStats.y1to3, color: "#22C55E" },
    { name: arabicSource("dashboard.3_5_years"), value: tenureStats.y3to5, color: "#D4AF37" },
    { name: arabicSource("dashboard.more_than_5"), value: tenureStats.over5, color: "#8B5CF6" },
  ];

  const warningDistribution = useMemo(() => {
    return Object.entries(warningStats.byType).map(([name, value], i) => ({
      name, value, color: ["#F59E0B", "#F97316", "#EF4444", "#DC2626", "#991B1B"][i] || "#EF4444",
    }));
  }, [warningStats]);

  return { leaveDistribution, tenureDistribution, warningDistribution };
};
