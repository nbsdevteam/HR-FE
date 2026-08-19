import type { ReactNode } from "react";

type ToolbarTextButtonProps = {
  onClick: () => void;
  children: ReactNode;
};

const ToolbarTextButton = ({ onClick, children }: ToolbarTextButtonProps) => (
  <button onClick={onClick} className="px-3 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 12 }}>
    {children}
  </button>
);

export default ToolbarTextButton;
