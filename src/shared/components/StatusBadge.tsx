import type { CSSProperties, ReactNode } from "react";

type StatusBadgeProps = {
  colorClassName: string;
  fontSize?: number;
  extraClassName?: string;
  style?: CSSProperties;
  children: ReactNode;
};

const StatusBadge = ({ colorClassName, fontSize = 12, extraClassName = "", style, children }: StatusBadgeProps) => (
  <span className={`inline-block px-2 py-0.5 rounded-md border break-words leading-snug ${colorClassName} ${extraClassName}`} style={{ fontSize, ...style }}>{children}</span>
);

export default StatusBadge;
