import type { ComponentType } from "react";

type AttendanceDetailTabButtonProps<T extends string> = {
  tab: {
    id: T;
    label: string;
    icon: ComponentType<{ className?: string }>;
  };
  active: boolean;
  onClick: (id: T) => void;
};

const AttendanceDetailTabButton = <T extends string>({ tab, active, onClick }: AttendanceDetailTabButtonProps<T>) => {
  const Icon = tab.icon;

  const handleTabClick = (): void => {
    onClick(tab.id);
  };

  return (
    <button
      onClick={handleTabClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
        active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-muted/20"
      }`}
      style={{ fontSize: 13 }}
    >
      <Icon className="w-4 h-4" />
      {tab.label}
    </button>
  );
}

export default AttendanceDetailTabButton;
