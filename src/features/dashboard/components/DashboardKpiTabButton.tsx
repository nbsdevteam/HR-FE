import type { ElementType } from "react";
import type { DashboardKpiSection } from "../types";

type DashboardKpiTabButtonProps = {
  tabKey: DashboardKpiSection;
  label: string;
  icon: ElementType;
  activeSection: DashboardKpiSection;
  onSectionChange: (section: DashboardKpiSection) => void;
};

const DashboardKpiTabButton = ({
  tabKey,
  label,
  icon: Icon,
  activeSection,
  onSectionChange,
}: DashboardKpiTabButtonProps) => {
  const handleTabClick = (): void => {
    onSectionChange(tabKey);
  };

  return (
    <button
      onClick={handleTabClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
        activeSection === tabKey
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "bg-card/30 border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm">{label}</span>
    </button>
  );
};

export default DashboardKpiTabButton;
