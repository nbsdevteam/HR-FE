import DashboardHeader from "../components/DashboardHeader";
import DashboardKpiTabs from "../components/DashboardKpiTabs";
import DashboardOverviewSection from "../components/DashboardOverviewSection";
import DashboardWorkforceSection from "../components/DashboardWorkforceSection";
import DashboardFinancialSection from "../components/DashboardFinancialSection";
import DashboardComplianceSection from "../components/DashboardComplianceSection";
import DashboardRecruitmentSection from "../components/DashboardRecruitmentSection";
import DashboardLoadingState from "../components/DashboardLoadingState";
import { useDashboardData } from "../hooks/useDashboardData";

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
    return <DashboardLoadingState />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader riskLevel={riskScore.level} unreadCount={unreadCount} />

      <DashboardKpiTabs activeSection={kpiSection} onSectionChange={handleKpiSectionChange} />

      {kpiSection === "overview" && <DashboardOverviewSection data={dashboardSectionData} />}

      {kpiSection === "workforce" && <DashboardWorkforceSection data={dashboardSectionData} />}

      {kpiSection === "financial" && <DashboardFinancialSection data={dashboardSectionData} />}

      {kpiSection === "compliance" && <DashboardComplianceSection data={dashboardSectionData} />}

      {kpiSection === "recruitment" && <DashboardRecruitmentSection data={dashboardSectionData} />}
    </div>
  );
};

export default Dashboard;
