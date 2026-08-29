import { useDashboardOverviewData } from "../hooks/useDashboardOverviewData";
import type { DashboardSectionData } from "../hooks/useDashboardData";
import DashboardStatGrid from "./DashboardStatGrid";
import DashboardAlertBanner from "./DashboardAlertBanner";
import DashboardDepartmentChart from "./DashboardDepartmentChart";
import DashboardAttendanceChart from "./DashboardAttendanceChart";
import DashboardHeadcountTrendChart from "./DashboardHeadcountTrendChart";
import DashboardPayrollTrendChart from "./DashboardPayrollTrendChart";
import DashboardQuickIndicatorsCard from "./DashboardQuickIndicatorsCard";
import DashboardRiskScorecard from "./DashboardRiskScorecard";
import DashboardNotificationsPanel from "./DashboardNotificationsPanel";

type DashboardOverviewSectionProps = {
  data: DashboardSectionData;
};

const DashboardOverviewSection = ({ data }: DashboardOverviewSectionProps) => {
  const {
    departmentData,
    colors,
    attendanceStats,
    attendanceChartData,
    headcountTrend,
    monthlyPayroll,
    payrollMoM,
    riskScore,
    notifications,
    unreadCount,
    cardCls,
  } = data;

  const {
    quickIndicators,
    dashboardStatsData,
    riskItemsPreview,
    notificationsPreview,
    alertBanners,
  } = useDashboardOverviewData(data);

  return (
    <>
      {/* Top-level KPI Cards */}
      <DashboardStatGrid hoverLift compactValue stats={dashboardStatsData} />

      {/* Alert Banners */}
      {alertBanners.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {alertBanners.map((banner) => (
            <DashboardAlertBanner
              key={banner.key}
              icon={banner.icon}
              message={banner.message}
              colorClassName={banner.colorClassName}
              textColorClassName={banner.textColorClassName}
            />
          ))}
        </div>
      )}

      {/* Charts Row 1: Department + Attendance Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardDepartmentChart
          departmentData={departmentData}
          color={colors.primary}
          cardCls={cardCls}
        />
        <DashboardAttendanceChart
          attendanceStats={attendanceStats}
          attendanceChartData={attendanceChartData}
          cardCls={cardCls}
        />
      </div>

      {/* Charts Row 2: Headcount Trend + Payroll Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardHeadcountTrendChart
          headcountTrend={headcountTrend}
          cardCls={cardCls}
        />
        <DashboardPayrollTrendChart
          monthlyPayroll={monthlyPayroll}
          payrollMoM={payrollMoM}
          color={colors.primary}
          cardCls={cardCls}
        />
      </div>

      {/* Charts Row 3: Quick KPIs + Risk Scorecard + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardQuickIndicatorsCard
          indicators={quickIndicators}
          cardCls={cardCls}
        />
        <DashboardRiskScorecard
          riskScore={riskScore}
          riskItemsPreview={riskItemsPreview}
          cardCls={cardCls}
        />
        <DashboardNotificationsPanel
          notifications={notifications}
          notificationsPreview={notificationsPreview}
          unreadCount={unreadCount}
          cardCls={cardCls}
        />
      </div>
    </>
  );
};

export default DashboardOverviewSection;
