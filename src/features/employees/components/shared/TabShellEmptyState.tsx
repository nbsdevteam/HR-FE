import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type TabShellEmptyStateProps = {
  icon: LucideIcon;
  message: ReactNode;
};

const TabShellEmptyState = ({ icon: Icon, message }: TabShellEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
    <Icon className="w-10 h-10 mb-3 opacity-30" />
    <p style={{ fontSize: 14 }}>{message}</p>
  </div>
);

export default TabShellEmptyState;
