import { memo } from "react";
import { arabicSource } from "@/i18n/source";

type PopoverExcuseButtonProps = {
  excused: boolean;
  onClick: () => void;
  paddingClassName: string;
};

const PopoverExcuseButton = ({ excused, onClick, paddingClassName }: PopoverExcuseButtonProps) => (
  <button
    onClick={onClick}
    className={`${paddingClassName} rounded-md border cursor-pointer transition-colors ${
      excused
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        : "bg-muted/10 border-border text-muted-foreground hover:border-primary/30"
    }`}
    style={{ fontSize: 11 }}
  >
    {excused ? arabicSource("common.sorry") : arabicSource("common.excuse")}
  </button>
);

export default memo(PopoverExcuseButton);
