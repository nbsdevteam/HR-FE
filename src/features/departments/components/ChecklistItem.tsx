import type { ReactNode } from "react";

type ChecklistItemProps = {
  dotColorClassName: string;
  children: ReactNode;
};

const ChecklistItem = ({ dotColorClassName, children }: ChecklistItemProps) => (
  <p className="text-muted-foreground flex items-center gap-2" style={{ fontSize: 12 }}>
    <span className={`w-1.5 h-1.5 rounded-full ${dotColorClassName} shrink-0`} />
    {children}
  </p>
);

export default ChecklistItem;
