import type { ReactNode } from "react";

type PopoverFooterBarProps = {
  children: ReactNode;
};

const PopoverFooterBar = ({ children }: PopoverFooterBarProps) => (
  <div className="px-6 py-3 border-t border-border/30 flex items-center justify-between">
    {children}
  </div>
);

export default PopoverFooterBar;
