import { memo } from "react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";

type CalendarExcuseButtonProps = {
  excused: boolean;
  onClick: () => void;
  hoverClassName: string;
};

const CalendarExcuseButton = ({ excused, onClick, hoverClassName }: CalendarExcuseButtonProps) => (
  <Button
    variant="unstyled"
    size="unstyled"
    rounded="rounded"
    onClick={onClick}
    className={`mt-1 px-2 py-0.5 text-center border ${
      excused
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        : `border-border/30 text-muted-foreground ${hoverClassName}`
    }`}
    style={{ fontSize: 9 }}
  >
    {excused ? arabicSource("common.sorry") : arabicSource("common.excuse")}
  </Button>
);

export default memo(CalendarExcuseButton);
