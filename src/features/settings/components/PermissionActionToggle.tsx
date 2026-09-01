import type { ChangeEvent } from "react";
import { permissionActionLabel } from "../utils/permissionLabels";

type TPermissionActionToggleProps = {
  section: string;
  action: string;
  granted: boolean;
  disabled: boolean;
  onToggle: (section: string, action: string) => void;
};

const PermissionActionToggle = ({
  section,
  action,
  granted,
  disabled,
  onToggle,
}: TPermissionActionToggleProps) => {
  const handleChange = (_e: ChangeEvent<HTMLInputElement>): void => {
    onToggle(section, action);
  };

  return (
    <label
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
        granted
          ? "border-primary/30 bg-primary/10 text-foreground"
          : "border-border/40 bg-background/40 text-muted-foreground"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary/40"}`}
    >
      <input
        type="checkbox"
        checked={granted}
        disabled={disabled}
        onChange={handleChange}
        className="accent-primary"
      />
      <span style={{ fontSize: 13 }}>{permissionActionLabel(action)}</span>
    </label>
  );
};

export default PermissionActionToggle;
