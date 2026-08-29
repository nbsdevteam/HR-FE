export type DashboardKpiSection =
  | "overview"
  | "workforce"
  | "financial"
  | "compliance"
  | "recruitment";

export type DashboardRiskLevel = "low" | "medium" | "high" | "critical";

export type DashboardRiskItem = {
  label: string;
  points: number;
  level: DashboardRiskLevel;
};

export type DashboardRiskScore = {
  score: number;
  level: DashboardRiskLevel;
  items: DashboardRiskItem[];
};

export type DashboardServerCards = {
  present?: number;
  absent?: number;
  on_leave?: number;
  late?: number;
  employees?: number;
};
