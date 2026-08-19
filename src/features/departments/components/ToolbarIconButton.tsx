import type { ComponentType } from "react";

type ToolbarIconButtonProps = {
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  title?: string;
  active?: boolean;
};

const ToolbarIconButton = ({ icon: Icon, onClick, title, active = false }: ToolbarIconButtonProps) => (
  <button onClick={onClick} title={title}
    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"}`}>
    <Icon className="w-4 h-4" />
  </button>
);

export default ToolbarIconButton;
