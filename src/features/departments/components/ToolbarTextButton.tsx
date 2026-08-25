import type { ReactNode } from "react";
import { Button } from "@/shared/components";

type ToolbarTextButtonProps = {
  onClick: () => void;
  children: ReactNode;
};

const ToolbarTextButton = ({ onClick, children }: ToolbarTextButtonProps) => (
  <Button
    variant="unstyled"
    size="unstyled"
    rounded="rounded-lg"
    onClick={onClick}
    className="px-3 py-1.5 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
    style={{ fontSize: 12 }}
  >
    {children}
  </Button>
);

export default ToolbarTextButton;
