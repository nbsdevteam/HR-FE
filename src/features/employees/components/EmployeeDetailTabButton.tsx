import { motion } from "motion/react";
import type { ComponentType } from "react";
import type { EmployeeDetailModalTab } from "../types";

type EmployeeDetailTabButtonProps = {
  tabKey: EmployeeDetailModalTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
  count: number | null;
  isActive: boolean;
  onSelect: (tab: EmployeeDetailModalTab) => void;
};

const EmployeeDetailTabButton = ({ tabKey, label, icon: TabIcon, count, isActive, onSelect }: EmployeeDetailTabButtonProps) => {
  const handleTabClick = (): void => {
    onSelect(tabKey);
  };

  return (
  <button
    onClick={handleTabClick}
    className={`relative flex items-center gap-1.5 px-4 py-3 transition-colors cursor-pointer ${
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`}
    style={{ fontSize: 13 }}
  >
    <TabIcon className="w-4 h-4" />
    {label}
    {count !== null && count > 0 && (
      <span className={`px-1.5 py-0.5 rounded-full ${isActive ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground"}`} style={{ fontSize: 10 }}>
        {count}
      </span>
    )}
    {isActive && (
      <motion.div
        layoutId="emp-panel-tab"
        className="absolute bottom-0 inset-x-2 h-[2px] bg-primary rounded-full"
      />
    )}
  </button>
  );
};

export default EmployeeDetailTabButton;
