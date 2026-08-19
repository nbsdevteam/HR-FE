import type { ReactNode } from "react";

type StatusBadgeProps = {
  colorClassName: string;
  fontSize?: number;
  extraClassName?: string;
  children: ReactNode;
};

const StatusBadge = ({ colorClassName, fontSize = 12, extraClassName = "", children }: StatusBadgeProps) => (
  <span className={`px-2 py-0.5 rounded-md border ${colorClassName} ${extraClassName}`} style={{ fontSize }}>{children}</span>
);

export default StatusBadge;
