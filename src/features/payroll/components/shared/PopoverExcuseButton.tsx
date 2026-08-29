import { memo } from "react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type PopoverExcuseButtonProps = {
  excused: boolean;
  onClick: () => void;
  paddingClassName: string;
};

const PopoverExcuseButton = ({ excused, onClick, paddingClassName }: PopoverExcuseButtonProps) => (
  <Button
    variant="unstyled"
    size="unstyled"
    rounded="rounded-md"
    onClick={onClick}
    className={`${paddingClassName} border ${
      excused
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        : "bg-muted/10 border-border text-muted-foreground hover:border-primary/30"
    }`}
    style={{ fontSize: 11 }}
  >
    {excused ? arabicSource("common.sorry") : arabicSource("common.excuse")}
  </Button>
);

export default memo(PopoverExcuseButton);
