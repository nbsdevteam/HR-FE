export type DashboardKpiSection =
  | "overview"
  | "workforce"
  | "financial"
  | "compliance"
  | "recruitment";

export type DashboardRiskLevel = "low" | "medium" | "high" | "critical";

export type DashboardRiskItem = {
  /** Stable backend key — also the React key, since two items can share a label. */
  key: string;
  label: string;
  points: number;
  level: DashboardRiskLevel;
};

export type DashboardRiskScore = {
  score: number;
  level: DashboardRiskLevel;
  items: DashboardRiskItem[];
};
