import type { ComponentType } from "react";
import { Button } from "@/shared/components";
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
    <Button
      variant="unstyled"
      size="unstyled"
      rounded="rounded-t-lg"
      onClick={handleTabClick}
      icon={Icon}
      className={`gap-2 px-4 py-2.5 ${
        isActive
          ? "bg-primary/10 border border-b-0 border-primary/30 text-primary"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {tab.label}
    </Button>
  );
};

export default AuditTabButton;
