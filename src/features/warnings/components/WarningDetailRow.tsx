import type { ReactNode } from "react";

type TWarningDetailRowProps = {
  label: string;
  children: ReactNode;
};

const WarningDetailRow = ({ label, children }: TWarningDetailRowProps) => (
  <div className="p-3 rounded-lg bg-muted/20">
    <span className="text-muted-foreground" style={{ fontSize: 13 }}>
      {label}{" "}
    </span>
    {children}
  </div>
);

export default WarningDetailRow;
