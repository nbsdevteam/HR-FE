import { lazy, Suspense } from "react";
import DashboardHeader from "../components/DashboardHeader";
import DashboardKpiTabs from "../components/DashboardKpiTabs";
import DashboardOverviewSection from "../components/DashboardOverviewSection";
import LoadingState from "@/shared/components/LoadingState";
import { arabicSource } from "@/i18n/source";
import { useDashboardData } from "../hooks/useDashboardData";

const DashboardWorkforceSection = lazy(
  () => import("../components/DashboardWorkforceSection"),
);
const DashboardFinancialSection = lazy(
  () => import("../components/DashboardFinancialSection"),
);
const DashboardComplianceSection = lazy(
  () => import("../components/DashboardComplianceSection"),
);
const DashboardRecruitmentSection = lazy(
  () => import("../components/DashboardRecruitmentSection"),
);

const Dashboard = () => {
  const {
    dashboardSectionData,
    handleKpiSectionChange,
    kpiSection,
    loading,
    riskScore,
    unreadCount,
  } = useDashboardData();

  if (loading) {
    return (
      <LoadingState message={arabicSource("dashboard.loading_control_panel")} />
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader riskLevel={riskScore.level} unreadCount={unreadCount} />

      <DashboardKpiTabs
        activeSection={kpiSection}
        onSectionChange={handleKpiSectionChange}
      />

      {kpiSection === "overview" && (
        <DashboardOverviewSection data={dashboardSectionData} />
      )}

      <Suspense
        fallback={
          <LoadingState
            message={arabicSource("dashboard.loading_control_panel")}
          />
        }
      >
        {kpiSection === "workforce" && (
          <DashboardWorkforceSection data={dashboardSectionData} />
        )}

        {kpiSection === "financial" && (
          <DashboardFinancialSection data={dashboardSectionData} />
        )}

        {kpiSection === "compliance" && (
          <DashboardComplianceSection data={dashboardSectionData} />
        )}

        {kpiSection === "recruitment" && (
          <DashboardRecruitmentSection data={dashboardSectionData} />
        )}
      </Suspense>
    </div>
  );
};

export default Dashboard;
