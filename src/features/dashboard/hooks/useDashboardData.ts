import { useState, useMemo, useCallback, useEffect } from "react";
import { useChartTheme } from "@/shared/components/chart-utils";
import { useControlPanelOverview, useControlPanelSection } from "@/shared/hooks";
import { useAppSettings } from "@/app/providers";
import type { DashboardKpiSection } from "../types";
import { dashboardCardClass } from "../styles";
import { buildDashboardSectionData } from "../utils/mapControlPanel";

/**
 * The whole Control Panel, from two requests on mount instead of nineteen.
 *
 * `/api/hr/control-panel/overview` carries every number the overview tab shows;
 * `/api/hr/control-panel/section` carries one KPI tab's extras and is fetched
 * only when that tab is opened. Both go through `requestCache`, so re-opening a
 * tab inside the 60 s TTL costs nothing.
 *
 * The one wrinkle: the overview's Quick Indicators card shows three numbers
 * that live in the compliance and recruitment sections (reviews awaited,
 * training under way, open jobs). Those two sections are therefore prefetched
 * — but only once the overview has resolved, so first paint still costs two
 * requests, and the prefetch warms the cache the tabs themselves read from.
 */
export const useDashboardData = () => {
  const [kpiSection, setKpiSection] = useState<DashboardKpiSection>("overview");
  const [prefetchExtras, setPrefetchExtras] = useState(false);

  const { colors } = useChartTheme();
  const { settings: appSettings } = useAppSettings();
  const { overview, loading } = useControlPanelOverview();
  const { section } = useControlPanelSection(
    kpiSection === "overview" ? null : kpiSection,
  );
  const { section: complianceExtras } = useControlPanelSection(
    prefetchExtras ? "compliance" : null,
  );
  const { section: recruitmentExtras } = useControlPanelSection(
    prefetchExtras ? "recruitment" : null,
  );

  const dashboardSectionData = useMemo(
    () => ({
      ...buildDashboardSectionData(
        overview,
        section,
        {
          evaluations: complianceExtras?.evaluations,
          training: complianceExtras?.training,
          recruitment: recruitmentExtras?.recruitment,
        },
        appSettings.monthFormat,
      ),
      colors,
      cardCls: dashboardCardClass,
    }),
    [
      overview,
      section,
      complianceExtras,
      recruitmentExtras,
      appSettings.monthFormat,
      colors,
    ],
  );

  const handleKpiSectionChange = useCallback((next: DashboardKpiSection) => {
    setKpiSection(next);
  }, []);

  useEffect(() => {
    if (overview) setPrefetchExtras(true);
  }, [overview]);

  return {
    dashboardSectionData,
    handleKpiSectionChange,
    kpiSection,
    loading,
    riskScore: dashboardSectionData.riskScore,
    unreadCount: dashboardSectionData.unreadCount,
  };
};

export type DashboardSectionData = ReturnType<
  typeof useDashboardData
>["dashboardSectionData"];
