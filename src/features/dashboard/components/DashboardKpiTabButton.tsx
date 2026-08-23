import { memo, useCallback, type ElementType } from "react";
import type { DashboardKpiSection } from "../types";

type DashboardKpiTabButtonProps = {
  tabKey: DashboardKpiSection;
  label: string;
  icon: ElementType;
  isActive: boolean;
  onSectionChange: (section: DashboardKpiSection) => void;
};

/**
 * Kept local rather than swapped for the shared `TabButton`: the dashboard tabs
 * live in a horizontally scrolling row (`whitespace-nowrap flex-shrink-0`,
 * responsive `px-3 sm:px-4`) and their inactive state is a bordered card chip,
 * whereas the shared `TabButton`/`TabGroup` pair renders a fixed-width
 * segmented control with a borderless inactive state.
 */
const DashboardKpiTabButton = ({
  tabKey,
  label,
  icon: Icon,
  isActive,
  onSectionChange,
}: DashboardKpiTabButtonProps) => {
  const handleTabClick = useCallback((): void => {
    onSectionChange(tabKey);
  }, [onSectionChange, tabKey]);

  return (
    <button
      onClick={handleTabClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "bg-card/30 border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm">{label}</span>
    </button>
  );
};

export default memo(DashboardKpiTabButton);
