import type { ReactNode } from "react";

type TabGroupProps = {
  children: ReactNode;
};

const TabGroup = ({ children }: TabGroupProps) => (
  <div className="flex gap-1 p-1 bg-card/40 border border-border/30 rounded-xl w-fit">
    {children}
  </div>
);

export default TabGroup;
