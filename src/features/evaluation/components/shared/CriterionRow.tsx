import type { ReactNode } from "react";

type CriterionRowProps = {
  name: string;
  children: ReactNode;
};

const CriterionRow = ({ name, children }: CriterionRowProps) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
    <span className="text-foreground" style={{ fontSize: 13 }}>{name}</span>
    {children}
  </div>
);

export default CriterionRow;
