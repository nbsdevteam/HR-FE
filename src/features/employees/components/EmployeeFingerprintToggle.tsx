import type { ChangeEvent } from "react";
import { Fingerprint } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type EmployeeFingerprintToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const EmployeeFingerprintToggle = ({ checked, onChange }: EmployeeFingerprintToggleProps) => {
  const handleCheckedChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.checked);
  };

  return (
    <label className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/10 cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleCheckedChange}
        className="w-4 h-4 rounded accent-primary"
      />
      <Fingerprint className="w-4 h-4 text-primary flex-shrink-0" />
      <div>
        <p className="text-sm text-foreground">{arabicSource("employees.capture_fingerprint_label")}</p>
        <p className="text-[11px] text-muted-foreground">{arabicSource("employees.capture_fingerprint_desc")}</p>
      </div>
    </label>
  );
};

export default EmployeeFingerprintToggle;
