import { memo, useCallback } from "react";
import { Check } from "lucide-react";
import { Button, NodeAvatar } from "@/shared/components";

type ReportSelectionOptionProps = {
  value: string;
  label: string;
  checked: boolean;
  /** Rendered as a small avatar before the label — employees only. */
  initials?: string;
  onToggle: (value: string) => void;
};

/**
 * One cell of the report selection grid: the whole row is the control, so a
 * click (or Enter/Space while focused) anywhere on it toggles the item.
 */
const ReportSelectionOption = ({
  value,
  label,
  checked,
  initials,
  onToggle,
}: ReportSelectionOptionProps) => {
  const handleToggle = useCallback((): void => {
    onToggle(value);
  }, [onToggle, value]);

  return (
    <Button
      variant="chip"
      size="unstyled"
      rounded="rounded-lg"
      active={checked}
      role="checkbox"
      aria-checked={checked}
      onClick={handleToggle}
      className="w-full min-w-0 justify-start gap-2 px-3 py-2 text-start"
      style={{ fontSize: 12 }}
    >
      <span
        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
          checked ? "bg-primary border-primary" : "border-border"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      </span>
      {initials && (
        <NodeAvatar
          name={label}
          initials={initials}
          sizeClassName="w-6 h-6"
          extraClassName="shrink-0"
          fallbackClassName="bg-primary/10 border border-primary/20"
          textClassName="text-primary"
          fontSize={10}
        />
      )}
      <span className="truncate" dir="auto">
        {label}
      </span>
    </Button>
  );
};

export default memo(ReportSelectionOption);
