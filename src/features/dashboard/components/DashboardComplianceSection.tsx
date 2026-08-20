import { Shield, Zap } from "lucide-react";
import { DonutChart } from "@/shared/components/donut-chart";
import ColorStatTile from "@/shared/components/ColorStatTile";
import LabeledMetricRow from "@/shared/components/LabeledMetricRow";
import { arabicSource } from "@/i18n/source";
import { useDashboardComplianceData } from "../hooks/useDashboardComplianceData";
import DashboardChartCard from "./DashboardChartCard";
import DashboardMiniBar from "./DashboardMiniBar";
import DashboardSectionStatCard from "./DashboardSectionStatCard";
import DashboardRatingLevelBar from "./DashboardRatingLevelBar";
import { pct } from "../utils/dashboardFormat";

type DashboardComplianceSectionProps = {
  data: any;
};

const DashboardComplianceSection = ({
  data,
}: DashboardComplianceSectionProps) => {
  const { cfg, evalStats, trainingStats, cardCls, warningDistribution, warningStats } = data;

  const { complianceStats, ratingLevels, trainingTiles } = useDashboardComplianceData(data);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {complianceStats.map((stat, i) => (
          <DashboardSectionStatCard key={stat.label} index={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <DashboardChartCard className={cardCls}>
          <h3 className="text-foreground mb-4">
            {arabicSource("dashboard.performance_evaluation_distribution")}
          </h3>
          {evalStats.completed > 0 ? (
            <div className="space-y-4">
              {ratingLevels.map((level) => (
                <DashboardRatingLevelBar
                  key={level.label}
                  label={level.label}
                  count={level.count}
                  color={level.color}
                  percent={pct(level.count, evalStats.completed)}
                />
              ))}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <LabeledMetricRow
                  label={arabicSource("dashboard.high_performance_4")}
                  value={`${pct(evalStats.high, evalStats.completed)}%`}
                  valueColorClassName="text-emerald-400"
                  wrapperClassName="bg-emerald-500/10"
                />
                <LabeledMetricRow
                  label={arabicSource("dashboard.needs_development_2")}
                  value={`${pct(evalStats.low, evalStats.completed)}%`}
                  valueColorClassName="text-red-400"
                  wrapperClassName="bg-red-500/10"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground">
              {arabicSource("dashboard.there_are_no_completed_reviews")}
            </div>
          )}
        </DashboardChartCard>

        {/* Warning Distribution */}
        <DashboardChartCard className={cardCls}>
          <h3 className="text-foreground mb-4">
            {arabicSource("dashboard.alarms_by_type")}
          </h3>
          {warningDistribution.length > 0 ? (
            <>
              <div
                className="flex items-center justify-center"
                style={{ height: 220 }}
              >
                <DonutChart data={warningDistribution} />
              </div>
              {warningStats.escalationRisk > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">
                    {warningStats.escalationRisk}{" "}
                    {arabicSource(
                      "dashboard.employee_with_multiple_alarms_escalation_risk",
                    )}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px]">
              <Shield className="w-12 h-12 text-emerald-400/30 mb-3" />
              <p className="text-emerald-400 text-sm">
                {arabicSource("dashboard.no_active_alarms")}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {arabicSource("dashboard.excellent_work_environment")}
              </p>
            </div>
          )}
        </DashboardChartCard>
      </div>

      {/* Training Section */}
      <DashboardChartCard className={cardCls}>
        <h3 className="text-foreground mb-4">
          {arabicSource("dashboard.summary_of_training_and_development")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {trainingTiles.map((tile) => (
            <ColorStatTile key={tile.label} {...tile} />
          ))}
        </div>
        {/* Coverage bar */}
        <div className="mt-4 p-3 rounded-lg bg-muted/20">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {arabicSource(
                "dashboard.training_coverage_percentage_of_employees_participating",
              )}
            </span>
            <span className="text-primary font-medium">
              {trainingStats.coverageRate}%
            </span>
          </div>
          <DashboardMiniBar
            value={trainingStats.coverageRate}
            max={100}
            color={
              trainingStats.coverageRate >= cfg.trainingCompletionTarget
                ? "bg-emerald-500"
                : "bg-amber-500"
            }
          />
        </div>
      </DashboardChartCard>
    </>
  );
};

export default DashboardComplianceSection;
