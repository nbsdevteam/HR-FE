import type { ReactNode } from "react";

type StatusBadgeProps = {
  colorClassName: string;
  children: ReactNode;
};

const StatusBadge = ({ colorClassName, children }: StatusBadgeProps) => (
  <span className={`px-2 py-0.5 rounded-md border ${colorClassName}`} style={{ fontSize: 12 }}>{children}</span>
);

export default StatusBadge;
