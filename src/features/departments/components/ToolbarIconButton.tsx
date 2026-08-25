import type { ComponentType } from "react";
import { Button } from "@/shared/components";

type ToolbarIconButtonProps = {
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  title?: string;
  active?: boolean;
};

const ToolbarIconButton = ({ icon: Icon, onClick, title, active = false }: ToolbarIconButtonProps) => (
  <Button
    variant="unstyled"
    size="unstyled"
    rounded="rounded-lg"
    onClick={onClick}
    title={title}
    className={`w-8 h-8 ${active ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"}`}
  >
    <Icon className="w-4 h-4" />
  </Button>
);

export default ToolbarIconButton;
