import type { ReactNode } from "react";

type InfoRowProps = {
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  dir?: "ltr";
};

const InfoRow = ({ label, value, valueClassName = "text-foreground", dir }: InfoRowProps) => (
  <div className="flex items-center justify-between py-2 border-b border-border/40">
    <span className="text-muted-foreground" style={{ fontSize: 12 }}>{label}</span>
    <div className={valueClassName} style={{ fontSize: 12, direction: dir }}>{value}</div>
  </div>
);

export default InfoRow;
