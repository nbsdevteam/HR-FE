import type { ReactNode } from "react";

type WarningDetailRowProps = {
  label: string;
  children: ReactNode;
};

const WarningDetailRow = ({ label, children }: WarningDetailRowProps) => (
  <div className="p-3 rounded-lg bg-muted/20">
    <span className="text-muted-foreground" style={{ fontSize: 13 }}>{label} </span>
    {children}
  </div>
);

export default WarningDetailRow;
