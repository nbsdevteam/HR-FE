import { Shield, Heart } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { dashboardRiskScoreTextColor } from "../data";
import type { DashboardRiskItem, DashboardRiskScore } from "../types";
import DashboardChartCard from "./DashboardChartCard";
import DashboardRiskBadge from "./DashboardRiskBadge";
import DashboardRiskItemRow from "./DashboardRiskItemRow";

type DashboardRiskScorecardProps = {
  riskScore: DashboardRiskScore;
  riskItemsPreview: DashboardRiskItem[];
  cardCls: string;
};

const DashboardRiskScorecard = ({
  riskScore,
  riskItemsPreview,
  cardCls,
}: DashboardRiskScorecardProps) => (
  <DashboardChartCard delay={0.8} className={cardCls}>
    <h3 className="text-foreground mb-4 flex items-center gap-2">
      <Shield className="w-4 h-4 text-primary" />{" "}
      {arabicSource("dashboard.risk_card")}
    </h3>
    <div className="text-center p-4 rounded-xl bg-muted/20 mb-4">
      <p
        className={`text-4xl font-bold ${dashboardRiskScoreTextColor[riskScore.level]}`}
      >
        {riskScore.score}
      </p>
      <p className="text-muted-foreground text-xs mt-1">
        {arabicSource("dashboard.out_of_100")}
      </p>
      <div className="mt-2">
        <DashboardRiskBadge level={riskScore.level} />
      </div>
    </div>
    <div className="space-y-2">
      {riskScore.items.length === 0 ? (
        <div className="text-center py-4">
          <Heart className="w-8 h-8 text-emerald-400/30 mx-auto mb-2" />
          <p className="text-emerald-400 text-sm">
            {arabicSource("dashboard.no_risks")}
          </p>
        </div>
      ) : (
        riskItemsPreview.map((item) => (
          <DashboardRiskItemRow
            key={item.label}
            label={item.label}
            level={item.level}
          />
        ))
      )}
    </div>
  </DashboardChartCard>
);

export default DashboardRiskScorecard;
