import type { ComponentType } from "react";
import type { AuditTabId } from "../types";

type AuditTabButtonProps = {
  tab: {
    key: AuditTabId;
    label: string;
    icon: ComponentType<{ className?: string }>;
  };
  isActive: boolean;
  onClick: (tab: AuditTabId) => void;
};

const AuditTabButton = ({ tab, isActive, onClick }: AuditTabButtonProps) => {
  const Icon = tab.icon;

  const handleTabClick = (): void => {
    onClick(tab.key);
  };

  return (
    <button
      onClick={handleTabClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-colors cursor-pointer ${
        isActive
          ? "bg-primary/10 border border-b-0 border-primary/30 text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
      {tab.label}
    </button>
  );
};

export default AuditTabButton;
