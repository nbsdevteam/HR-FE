import { memo } from "react";
import { useAppLanguage } from "@/i18n/useLocalizedName";
import type { ExitProgress } from "@/shared/hooks";
import { requiredItemText } from "../utils/exitProgress";

type ExitNextStepCellProps = {
  progress: ExitProgress;
};

/** The next required step, with a `+N` badge whose tooltip lists the rest. */
const ExitNextStepCell = ({ progress }: ExitNextStepCellProps) => {
  const lang = useAppLanguage();
  const { next, still_required: required } = progress;
  if (!next) return <span className="text-muted-foreground">—</span>;

  const rest = required.slice(1);

  return (
    <span className="flex flex-wrap items-center gap-1.5" data-exit-next={next.code}>
      <span className="text-foreground" style={{ fontSize: 13 }} dir="auto">{requiredItemText(next, lang)}</span>
      {rest.length > 0 && (
        <span
          className="px-1.5 rounded-md bg-muted/30 text-muted-foreground"
          style={{ fontSize: 11 }}
          dir="ltr"
          title={rest.map(item => requiredItemText(item, lang)).join("\n")}
        >
          +{rest.length}
        </span>
      )}
    </span>
  );
};

export default memo(ExitNextStepCell);
