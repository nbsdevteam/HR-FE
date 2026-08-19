import type { LucideIcon } from "lucide-react";
import type { LeaveTabId } from "../types";

type LeaveTabButtonProps = {
  id: LeaveTabId;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onSelect: (tabId: LeaveTabId) => void;
};

const LeaveTabButton = ({ id, label, icon: Icon, isActive, onSelect }: LeaveTabButtonProps) => (
  <button
    onClick={() => onSelect(id)}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
      isActive
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
    }`}
    style={{ fontSize: 13 }}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

export default LeaveTabButton;
