import { leaveTabs, type LeaveTabId } from "../types";

type LeaveTabsProps = {
  activeTab: LeaveTabId;
  onTabChange: (tabId: LeaveTabId) => void;
};

export const LeaveTabs = ({ activeTab, onTabChange }: LeaveTabsProps) => (
  <div className="flex gap-1 p-1 bg-card/40 border border-border/30 rounded-xl w-fit">
    {leaveTabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all cursor-pointer ${
            isActive
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
          style={{ fontSize: 13 }}
        >
          <Icon className="w-4 h-4" />
          {tab.label}
        </button>
      );
    })}
  </div>
);
