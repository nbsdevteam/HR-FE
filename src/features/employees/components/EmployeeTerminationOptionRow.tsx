import type { ComponentType } from "react";

type EmployeeTerminationOptionRowProps = {
  label: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const EmployeeTerminationOptionRow = ({ label, desc, icon: Icon, checked, onChange }: EmployeeTerminationOptionRowProps) => (
  <label className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-muted/10 cursor-pointer transition-colors">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded accent-red-500"
    />
    <Icon className="w-4 h-4 text-red-400 flex-shrink-0" />
    <div>
      <p className="text-sm text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </div>
  </label>
);

export default EmployeeTerminationOptionRow;
